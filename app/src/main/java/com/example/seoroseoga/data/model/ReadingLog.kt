package com.example.seoroseoga.data.model

data class ReadingLog(
    val readingLogId: String,
    val source: ReadingBookSource,
    val bookId: String,
    val title: String,
    val author: String,
    val coverImageUri: String? = null,
    val coverImageRes: Int? = null,
    val currentPage: Int = 0,
    val totalPage: Int = 300,
    val quote: String = "",
    val review: String = "",
    val updatedAtMillis: Long
)
