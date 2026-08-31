package com.example.catbreedsapp

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel

// ViewModel holds breed data across orientation changes
class CatViewModel : ViewModel() {

    // List of all breeds for the spinner
    private val _breeds = MutableLiveData<List<CatBreed>>()
    val breeds: LiveData<List<CatBreed>> = _breeds

    // Currently selected breed
    private val _selectedBreed = MutableLiveData<CatBreed?>()
    val selectedBreed: LiveData<CatBreed?> = _selectedBreed

    // Image URL for the selected breed
    private val _imageUrl = MutableLiveData<String?>()
    val imageUrl: LiveData<String?> = _imageUrl

    // Loading state
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading

    // Error message
    private val _errorMessage = MutableLiveData<String?>()
    val errorMessage: LiveData<String?> = _errorMessage

    fun setBreeds(breeds: List<CatBreed>) {
        _breeds.value = breeds
    }

    fun selectBreed(breed: CatBreed) {
        _selectedBreed.value = breed
    }

    fun setImageUrl(url: String?) {
        _imageUrl.value = url
    }

    fun setLoading(loading: Boolean) {
        _isLoading.value = loading
    }

    fun setError(message: String?) {
        _errorMessage.value = message
    }
}