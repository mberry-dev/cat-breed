package com.example.catbreedsapp

import org.junit.Assert.assertEquals
import org.junit.Test

// These mirror web/tests/breeds.test.js value for value, so the two apps show breeds the same way.
class CatFormatTest {

    @Test fun lifeSpanGetsTheWordYears() {
        assertEquals("14 - 15 years", CatFormat.lifeSpan("14 - 15"))
        assertEquals("12 years", CatFormat.lifeSpan(" 12 "))
    }

    @Test fun weightGetsKg() {
        assertEquals("3 - 5 kg", CatFormat.weight("3 - 5"))
    }

    @Test fun missingValuesShowUnknownNotAnEmptyGapOrUnknownKg() {
        assertEquals("Unknown", CatFormat.lifeSpan(""))
        assertEquals("Unknown", CatFormat.weight("   "))
        assertEquals("Unknown", CatFormat.orUnknown(""))
        assertEquals("Egypt", CatFormat.orUnknown("Egypt"))
    }
}
