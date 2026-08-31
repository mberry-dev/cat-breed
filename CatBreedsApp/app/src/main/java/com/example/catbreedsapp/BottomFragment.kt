package com.example.catbreedsapp

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.bumptech.glide.Glide

// Bottom fragment — displays cat image and breed information
class BottomFragment : Fragment() {

    private val viewModel: CatViewModel by activityViewModels()

    private lateinit var catImage: ImageView
    private lateinit var nameText: TextView
    private lateinit var originText: TextView
    private lateinit var temperamentText: TextView
    private lateinit var descriptionText: TextView
    private lateinit var lifeSpanText: TextView
    private lateinit var weightText: TextView
    private lateinit var placeholderText: TextView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val view = inflater.inflate(R.layout.fragment_bottom, container, false)

        catImage        = view.findViewById(R.id.catImage)
        nameText        = view.findViewById(R.id.nameText)
        originText      = view.findViewById(R.id.originText)
        temperamentText = view.findViewById(R.id.temperamentText)
        descriptionText = view.findViewById(R.id.descriptionText)
        lifeSpanText    = view.findViewById(R.id.lifeSpanText)
        weightText      = view.findViewById(R.id.weightText)
        placeholderText = view.findViewById(R.id.placeholderText)

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Show placeholder until a breed is selected
        placeholderText.visibility = View.VISIBLE
        catImage.visibility = View.GONE

        // Observe selected breed and update UI
        viewModel.selectedBreed.observe(viewLifecycleOwner) { breed ->
            if (breed != null) {
                placeholderText.visibility = View.GONE
                showBreedInfo(breed)
            }
        }

        // Observe image URL and load with Glide
        viewModel.imageUrl.observe(viewLifecycleOwner) { url ->
            if (!url.isNullOrEmpty()) {
                Glide.with(this)
                    .load(url)
                    .placeholder(android.R.drawable.ic_menu_gallery)
                    .error(android.R.drawable.ic_menu_close_clear_cancel)
                    .into(catImage)
                catImage.visibility    = View.VISIBLE
                placeholderText.visibility = View.GONE
            } else {
                catImage.visibility        = View.GONE
                placeholderText.visibility = View.VISIBLE
                placeholderText.text       = "No image available"
            }
        }
    }

    // Populate all text views with breed data
    private fun showBreedInfo(breed: CatBreed) {
        placeholderText.visibility = View.GONE

        nameText.text        = breed.name
        originText.text      = breed.origin
        temperamentText.text = breed.temperament
        descriptionText.text = breed.description
        lifeSpanText.text    = "${breed.lifeSpan} years"
        weightText.text      = "${breed.weight} kg"
    }
}