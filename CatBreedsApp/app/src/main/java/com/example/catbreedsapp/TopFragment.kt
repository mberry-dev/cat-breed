package com.example.catbreedsapp

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.Spinner
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels

// Top fragment — the breed spinner, a loading/error message and a Retry button.
// The Cat API requests are made in CatViewModel.
class TopFragment : Fragment() {

    // Shared ViewModel between both fragments
    private val viewModel: CatViewModel by activityViewModels()

    private lateinit var spinner: Spinner
    private lateinit var statusText: TextView
    private lateinit var retryButton: Button

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_top, container, false)

        spinner     = view.findViewById(R.id.breedSpinner)
        statusText  = view.findViewById(R.id.statusText)
        retryButton = view.findViewById(R.id.retryButton)

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Keep the purple header out from under the status bar and camera cutout
        // (Android 15+ draws apps edge to edge, so the clock and icons would overlap the title)
        val basePaddingTop = view.paddingTop
        ViewCompat.setOnApplyWindowInsetsListener(view) { v, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            v.updatePadding(top = basePaddingTop + bars.top)
            insets
        }

        viewModel.breeds.observe(viewLifecycleOwner) { breeds ->
            if (breeds.isNotEmpty()) setupSpinner(breeds)
        }
        viewModel.isLoading.observe(viewLifecycleOwner) { showStatus() }
        viewModel.errorMessage.observe(viewLifecycleOwner) { showStatus() }

        retryButton.setOnClickListener { viewModel.loadBreeds() }
    }

    // One message line: "Loading breeds...", an error with a Retry button, or nothing
    private fun showStatus() {
        val error = viewModel.errorMessage.value
        val loading = viewModel.isLoading.value == true
        when {
            loading -> {
                statusText.text = "Loading breeds..."
                statusText.visibility = View.VISIBLE
                retryButton.visibility = View.GONE
            }
            !error.isNullOrEmpty() -> {
                statusText.text = error
                statusText.visibility = View.VISIBLE
                retryButton.visibility = View.VISIBLE
            }
            else -> {
                statusText.visibility = View.GONE
                retryButton.visibility = View.GONE
            }
        }
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
                viewModel.selectBreed(breeds[pos])
            }
            override fun onNothingSelected(parent: AdapterView<*>) {}
        }
    }
}
