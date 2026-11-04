package com.example.catbreedsapp

// How breed values are shown on screen, plus the messages. Pure functions with no Android code, so they can be
// unit tested. The web version (web/src/breeds.js) follows the same rules and has matching tests.
object CatFormat {

    const val MSG_KEY = "Invalid API key."
    const val MSG_LIST = "Could not load the breed list. Check your connection and try again."
    const val MSG_DATA = "Error reading breed data"

    const val UNKNOWN = "Unknown"

    // Any text field: blank shows "Unknown" instead of an empty gap
    fun orUnknown(value: String): String = value.trim().ifEmpty { UNKNOWN }

    // "14 - 15 years"
    fun lifeSpan(value: String): String =
        if (value.isBlank()) UNKNOWN else "${value.trim()} years"

    // "3 - 5 kg"
    fun weight(value: String): String =
        if (value.isBlank()) UNKNOWN else "${value.trim()} kg"
}
