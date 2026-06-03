package com.example.seoroseoga.data.model

data class BorrowedBook(
    val borrowedId: String,
    val rentalBook: RentalBook,
    val borrowedAtMillis: Long
)
