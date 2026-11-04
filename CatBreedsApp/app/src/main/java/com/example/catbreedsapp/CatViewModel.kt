package com.example.catbreedsapp

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.android.volley.ParseError
import com.android.volley.Request
import com.android.volley.RequestQueue
import com.android.volley.VolleyError
import com.android.volley.toolbox.JsonArrayRequest
import com.android.volley.toolbox.JsonObjectRequest
import com.android.volley.toolbox.Volley

// Holds the breed data and does the Cat API requests. Because it lives in the ViewModel, the data and any
// request in progress survive screen rotation.
class CatViewModel(application: Application) : AndroidViewModel(application) {

    private val queue: RequestQueue by lazy { Volley.newRequestQueue(application) }
    private val apiKey = BuildConfig.CAT_API_KEY

    // List of all breeds for the spinner
    private val _breeds = MutableLiveData<List<CatBreed>>(emptyList())
    val breeds: LiveData<List<CatBreed>> = _breeds

    // Currently selected breed
    private val _selectedBreed = MutableLiveData<CatBreed?>()
    val selectedBreed: LiveData<CatBreed?> = _selectedBreed

    // Photo of the selected breed (null when there is none)
    private val _imageUrl = MutableLiveData<String?>()
    val imageUrl: LiveData<String?> = _imageUrl

    private val _isImageLoading = MutableLiveData(false)
    val isImageLoading: LiveData<Boolean> = _isImageLoading

    // Loading the breed list
    private val _isLoading = MutableLiveData(false)
    val isLoading: LiveData<Boolean> = _isLoading

    // Error message for the breed list
    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage

    // Each photo request gets a number; an answer to an older one is ignored, so a slow response for the
    // previous breed can never replace the photo of the breed you picked last
    private var imageRequestId = 0

    init {
        loadBreeds()
    }

    // Fetches all breeds (also used by the Retry button)
    fun loadBreeds() {
        _isLoading.value = true
        _errorMessage.value = null

        val request = object : JsonArrayRequest(
            Request.Method.GET, BREEDS_URL, null,
            { response ->
                try {
                    _breeds.value = CatParser.parseBreeds(response)
                    _isLoading.value = false
                } catch (e: Exception) {
                    fail(CatFormat.MSG_DATA)
                }
            },
            { error -> fail(messageFor(error)) }
        ) {
            override fun getHeaders(): MutableMap<String, String> = mutableMapOf("x-api-key" to apiKey)
        }
        request.tag = TAG
        queue.add(request)
    }

    fun selectBreed(breed: CatBreed) {
        if (_selectedBreed.value?.id == breed.id) return // the spinner reports the same choice again after rotation
        _selectedBreed.value = breed
        loadImage(breed.referenceImageId)
    }

    private fun loadImage(imageId: String) {
        queue.cancelAll(IMAGE_TAG)
        val id = ++imageRequestId
        _imageUrl.value = null
        if (imageId.isEmpty()) {
            _isImageLoading.value = false
            return
        }
        _isImageLoading.value = true

        val request = object : JsonObjectRequest(
            Request.Method.GET, "https://api.thecatapi.com/v1/images/$imageId", null,
            { response ->
                if (id == imageRequestId) {
                    val url = if (response.isNull("url")) "" else response.optString("url", "")
                    _imageUrl.value = url.ifBlank { null }
                    _isImageLoading.value = false
                }
            },
            {
                if (id == imageRequestId) {
                    _imageUrl.value = null
                    _isImageLoading.value = false
                }
            }
        ) {
            override fun getHeaders(): MutableMap<String, String> = mutableMapOf("x-api-key" to apiKey)
        }
        request.tag = IMAGE_TAG
        queue.add(request)
    }

    private fun fail(message: String) {
        _isLoading.value = false
        _errorMessage.value = message
    }

    private fun messageFor(error: VolleyError): String = when {
        error.networkResponse?.statusCode == 401 || error.networkResponse?.statusCode == 403 -> CatFormat.MSG_KEY
        error is ParseError -> CatFormat.MSG_DATA
        else -> CatFormat.MSG_LIST
    }

    override fun onCleared() {
        queue.cancelAll(TAG)
        queue.cancelAll(IMAGE_TAG)
        super.onCleared()
    }

    private companion object {
        const val BREEDS_URL = "https://api.thecatapi.com/v1/breeds"
        const val TAG = "breeds"
        const val IMAGE_TAG = "image"
    }
}
