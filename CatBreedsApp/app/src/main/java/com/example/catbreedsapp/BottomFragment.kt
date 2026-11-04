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

// Bottom fragment — displays the cat photo and breed information
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

    // The photo currently shown, so the same photo isn't reloaded every time something else changes
    private var shownUrl: String? = null

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

        viewModel.selectedBreed.observe(viewLifecycleOwner) { render() }
        viewModel.imageUrl.observe(viewLifecycleOwner) { render() }
        viewModel.isImageLoading.observe(viewLifecycleOwner) { render() }
    }

    // Draws the screen from the current state: nothing picked yet, or a breed with its photo (or why there is none)
    private fun render() {
        val breed = viewModel.selectedBreed.value
        val url = viewModel.imageUrl.value
        val loadingImage = viewModel.isImageLoading.value == true

        if (breed == null) {
            placeholderText.text = "Select a breed to see information"
            placeholderText.visibility = View.VISIBLE
            catImage.visibility = View.GONE
            return
        }

        nameText.text        = breed.name
        originText.text      = CatFormat.orUnknown(breed.origin)
        lifeSpanText.text    = CatFormat.lifeSpan(breed.lifeSpan)
        weightText.text      = CatFormat.weight(breed.weight)
        temperamentText.text = CatFormat.orUnknown(breed.temperament)
        descriptionText.text = CatFormat.orUnknown(breed.description)

        when {
            !url.isNullOrEmpty() -> {
                if (url != shownUrl) {
                    Glide.with(this)
                        .load(url)
                        .placeholder(android.R.drawable.ic_menu_gallery)
                        .error(android.R.drawable.ic_menu_close_clear_cancel)
                        .into(catImage)
                    shownUrl = url
                }
                catImage.visibility = View.VISIBLE
                placeholderText.visibility = View.GONE
            }
            loadingImage -> {
                shownUrl = null
                catImage.visibility = View.GONE
                placeholderText.text = "Loading image..."
                placeholderText.visibility = View.VISIBLE
            }
            else -> {
                shownUrl = null
                catImage.visibility = View.GONE
                placeholderText.text = "No image available"
                placeholderText.visibility = View.VISIBLE
            }
        }
    }
}
