package com.example.catbreedsapp

import org.json.JSONArray
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

// These mirror web/tests/breeds.test.js: the same sample data must give the same breeds on both apps.
class CatParserTest {

    private val sample = """
        [
          {"id":"sibe","name":"Siberian","origin":"Russia","temperament":"Curious, Intelligent","life_span":"12 - 15",
           "weight":{"imperial":"8 - 16","metric":"3 - 7"},"description":"Strong and smart.","reference_image_id":"3bkZAjRh1"},
          {"id":"abys","name":"abyssinian","origin":"Egypt","temperament":"Active, Gentle","life_span":"14 - 15",
           "weight":{"imperial":"7  -  10","metric":"3 - 5"},"description":"Loves to climb.","reference_image_id":"0XYvRd7oD"},
          {"id":"nowt","name":"No Weight Cat","origin":null,"life_span":"10 - 12","description":"Mystery."},
          {"id":"","name":"No Id"},
          {"id":"noname","name":""},
          "not an object"
        ]
    """.trimIndent()

    @Test fun parsesEveryField() {
        val abys = CatParser.parseBreeds(JSONArray(sample)).first { it.id == "abys" }
        assertEquals("abyssinian", abys.name)
        assertEquals("Egypt", abys.origin)
        assertEquals("Active, Gentle", abys.temperament)
        assertEquals("Loves to climb.", abys.description)
        assertEquals("14 - 15", abys.lifeSpan)
        assertEquals("3 - 5", abys.weight)
        assertEquals("0XYvRd7oD", abys.referenceImageId)
    }

    @Test fun sortsByNameIgnoringCase() {
        val names = CatParser.parseBreeds(JSONArray(sample)).map { it.name }
        assertEquals(listOf("abyssinian", "No Weight Cat", "Siberian"), names)
    }

    @Test fun skipsEntriesWithoutAnIdOrAName() {
        val breeds = CatParser.parseBreeds(JSONArray(sample))
        assertEquals(3, breeds.size)
        assertTrue(breeds.none { it.id.isEmpty() || it.name.isEmpty() })
    }

    @Test fun missingOrNullFieldsBecomeEmptyNotTheTextNull() {
        val nowt = CatParser.parseBreeds(JSONArray(sample)).first { it.id == "nowt" }
        assertEquals("", nowt.origin)
        assertEquals("", nowt.weight)
        assertEquals("", nowt.referenceImageId)
        assertEquals("", nowt.temperament)
    }

    @Test fun emptyListGivesEmptyResult() {
        assertTrue(CatParser.parseBreeds(JSONArray("[]")).isEmpty())
    }
}
