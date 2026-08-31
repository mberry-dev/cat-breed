package com.example.catbreedsapp

// Data class representing a single cat breed from the Cat API
data class CatBreed(
    val id: String,
    val name: String,
    val temperament: String,
    val origin: String,
    val description: String,
    val lifeSpan: String,
    val weight: String,
    val referenceImageId: String
) {
    // Used by the Spinner to display the breed name
    override fun toString(): String = name
}