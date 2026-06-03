package com.example.seoroseoga.data.model

data class MyBook(
    val myBookId: String,
    val title: String,
    val author: String,
    val publisher: String = "",
    val coverImageUri: String? = null,
    val addedAtMillis: Long
)
