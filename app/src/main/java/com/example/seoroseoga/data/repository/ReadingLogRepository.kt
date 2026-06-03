package com.example.seoroseoga.data.repository

import com.example.seoroseoga.data.local.ReadingLogLocalDataSource
import com.example.seoroseoga.data.model.ReadingBookSource
import com.example.seoroseoga.data.model.ReadingComment
import com.example.seoroseoga.data.model.ReadingLog

class ReadingLogRepository(
    private val localDataSource: ReadingLogLocalDataSource
) {
    fun getOrCreateReadingLog(
        source: ReadingBookSource,
        bookId: String,
        title: String,
        author: String,
        coverImageUri: String?,
        coverImageRes: Int?
    ): ReadingLog =
        localDataSource.getOrCreateReadingLog(
            source = source,
            bookId = bookId,
            title = title,
            author = author,
            coverImageUri = coverImageUri,
            coverImageRes = coverImageRes
        )

    fun updatePage(
        source: ReadingBookSource,
        bookId: String,
        currentPage: Int,
        totalPage: Int
    ): ReadingLog? =
        localDataSource.updatePage(
            source = source,
            bookId = bookId,
            currentPage = currentPage,
            totalPage = totalPage
        )

    fun updateQuote(
        source: ReadingBookSource,
        bookId: String,
        quote: String
    ): ReadingLog? =
        localDataSource.updateQuote(
            source = source,
            bookId = bookId,
            quote = quote
        )

    fun updateReview(
        source: ReadingBookSource,
        bookId: String,
        review: String
    ): ReadingLog? =
        localDataSource.updateReview(
            source = source,
            bookId = bookId,
            review = review
        )

    fun getMockComments(): List<ReadingComment> =
        localDataSource.getMockComments()
}
