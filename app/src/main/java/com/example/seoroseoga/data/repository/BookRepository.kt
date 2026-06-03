package com.example.seoroseoga.data.repository

import com.example.seoroseoga.data.local.BookLocalDataSource
import com.example.seoroseoga.data.model.Book

class BookRepository(
    private val localDataSource: BookLocalDataSource = BookLocalDataSource
) {
    fun getAiRecommendedBooks(): List<Book> = localDataSource.getAiRecommendedBooks()

    fun getBookById(bookId: String): Book? = localDataSource.getBookById(bookId)
}