package com.example.catbreedsapp

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Spinner
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.android.volley.Request
import com.android.volley.toolbox.JsonArrayRequest
import com.android.volley.toolbox.Volley
import org.json.JSONArray

// Top fragment — contains the breed spinner and fetches breed list from Cat API
class TopFragment : Fragment() {

    // Shared ViewModel between both fragments
    private val viewModel: CatViewModel by activityViewModels()

    // Your Cat API key
    private val API_KEY = "live_luezcPItgSmx3WvWROMxQrC6WiHySOmgFIDz39Xj14H39eXTg50VpjPtZRKHK4GB"

    private lateinit var spinner: Spinner
    private lateinit var statusText: TextView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_top, container, false)

        spinner    = view.findViewById(R.id.breedSpinner)
        statusText = view.findViewById(R.id.statusText)

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Observe breed list from ViewModel
        viewModel.breeds.observe(viewLifecycleOwner) { breeds ->
            if (breeds.isNotEmpty()) {
                setupSpinner(breeds)
                statusText.visibility = View.GONE
            }
        }

        // Only fetch breeds if not already loaded
        if (viewModel.breeds.value.isNullOrEmpty()) {
            fetchBreeds()
        }
    }

    // Fetch all cat breeds from the Cat API
    private fun fetchBreeds() {
        statusText.text = "Loading breeds..."
        statusText.visibility = View.VISIBLE

        val url = "https://api.thecatapi.com/v1/breeds"
        val queue = Volley.newRequestQueue(requireContext())

        val request = object : JsonArrayRequest(
            Request.Method.GET, url, null,
            { response -> parseBreeds(response) },
            { error ->
                statusText.text = "Error loading breeds: ${error.message}"
                viewModel.setError(error.message)
            }
        ) {
            // Add API key to request headers
            override fun getHeaders(): MutableMap<String, String> {
                return mutableMapOf("x-api-key" to API_KEY)
            }
        }

        queue.add(request)
    }

    // Parse JSON array of breeds into CatBreed data objects
    private fun parseBreeds(response: JSONArray) {
        val breeds = mutableListOf<CatBreed>()

        for (i in 0 until response.length()) {
            val obj = response.getJSONObject(i)
            breeds.add(
                CatBreed(
                    id              = obj.optString("id"),
                    name            = obj.optString("name"),
                    temperament     = obj.optString("temperament"),
                    origin          = obj.optString("origin"),
                    description     = obj.optString("description"),
                    lifeSpan        = obj.optString("life_span"),
                    weight          = obj.optJSONObject("weight")?.optString("metric") ?: "Unknown",
                    referenceImageId = obj.optString("reference_image_id")
                )
            )
        }

        // Sort alphabetically and update ViewModel
        viewModel.setBreeds(breeds.sortedBy { it.name })
    }

    // Set up the spinner with breed names
    private fun setupSpinner(breeds: List<CatBreed>) {
        val adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_item,
            breeds
        )
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
        spinner.adapter = adapter

        // Restore previously selected breed after rotation
        viewModel.selectedBreed.value?.let { selected ->
            val position = breeds.indexOfFirst { it.id == selected.id }
            if (position >= 0) spinner.setSelection(position)
        }

        spinner.onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
            override fun onItemSelected(parent: AdapterView<*>, view: View?, pos: Int, id: Long) {
                val breed = breeds[pos]
                viewModel.selectBreed(breed)
                fetchBreedImage(breed.referenceImageId)
            }
            override fun onNothingSelected(parent: AdapterView<*>) {}
        }
    }

    // Fetch the image URL for the selected breed
    private fun fetchBreedImage(imageId: String) {
        if (imageId.isEmpty()) {
            viewModel.setImageUrl(null)
            return
        }

        val url = "https://api.thecatapi.com/v1/images/$imageId"
        val queue = Volley.newRequestQueue(requireContext())

        val request = object : com.android.volley.toolbox.JsonObjectRequest(
            Request.Method.GET, url, null,
            { response ->
                val imageUrl = response.optString("url")
                viewModel.setImageUrl(imageUrl)
            },
            { viewModel.setImageUrl(null) }
        ) {
            override fun getHeaders(): MutableMap<String, String> {
                return mutableMapOf("x-api-key" to API_KEY)
            }
        }

        queue.add(request)
    }
}