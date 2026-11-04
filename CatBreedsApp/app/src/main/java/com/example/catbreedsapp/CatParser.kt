package com.example.catbreedsapp

import org.json.JSONArray
import org.json.JSONObject

// Turns the Cat API's breed list (JSON) into CatBreed objects. No Android code, so it can be unit tested.
object CatParser {

    // Breeds without an id or a name are skipped. The result is sorted by name, ignoring upper/lower case.
    fun parseBreeds(array: JSONArray): List<CatBreed> {
        val breeds = mutableListOf<CatBreed>()
        for (i in 0 until array.length()) {
            val item = array.optJSONObject(i) ?: continue
            val id = text(item, "id")
            val name = text(item, "name")
            if (id.isBlank() || name.isBlank()) continue

            breeds.add(
                CatBreed(
                    id               = id,
                    name             = name,
                    temperament      = text(item, "temperament"),
                    origin           = text(item, "origin"),
                    description      = text(item, "description"),
                    lifeSpan         = text(item, "life_span"),
                    weight           = item.optJSONObject("weight")?.let { text(it, "metric") } ?: "",
                    referenceImageId = text(item, "reference_image_id")
                )
            )
        }
        return breeds.sortedBy { it.name.lowercase() }
    }

    // A missing field or an explicit JSON null gives "" (org.json would otherwise return the text "null")
    private fun text(obj: JSONObject, key: String): String =
        if (obj.isNull(key)) "" else obj.optString(key, "")
}
