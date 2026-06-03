package com.example.seoroseoga.data.repository

import com.example.seoroseoga.data.local.BorrowedBookLocalDataSource
import com.example.seoroseoga.data.model.BorrowedBook
import com.example.seoroseoga.data.model.RentalBook

class BorrowedBookRepository(
    private val localDataSource: BorrowedBookLocalDataSource
) {
    fun addBorrowedBook(rentalBook: RentalBook): BorrowedBook =
        localDataSource.addBorrowedBook(rentalBook)

    fun getBorrowedBooks(): List<BorrowedBook> =
        localDataSource.getBorrowedBooks()

    fun getBorrowedBookById(borrowedId: String): BorrowedBook? =
        getBorrowedBooks().firstOrNull { it.borrowedId == borrowedId }
}
