package com.example.seoroseoga.data.repository

import com.example.seoroseoga.data.local.MyBookLocalDataSource
import com.example.seoroseoga.data.model.MyBook

class MyBookRepository(
    private val localDataSource: MyBookLocalDataSource
) {
    fun addMyBook(
        title: String,
        author: String,
        publisher: String,
        coverImageUri: String?
    ): MyBook =
        localDataSource.addMyBook(
            title = title,
            author = author,
            publisher = publisher,
            coverImageUri = coverImageUri
        )

    fun getMyBooks(): List<MyBook> =
        localDataSource.getMyBooks()

    fun getMyBookById(myBookId: String): MyBook? =
        getMyBooks().firstOrNull { it.myBookId == myBookId }
}
