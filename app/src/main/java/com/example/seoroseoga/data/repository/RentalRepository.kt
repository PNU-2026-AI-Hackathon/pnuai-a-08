package com.example.seoroseoga.data.repository

import com.example.seoroseoga.data.local.RentalBookLocalDataSource
import com.example.seoroseoga.data.model.RentalBook

class RentalRepository(
    private val localDataSource: RentalBookLocalDataSource = RentalBookLocalDataSource
) {
    fun getRentalBooks(): List<RentalBook> = localDataSource.getRentalBooks()

    fun getRentalBookById(rentalId: String): RentalBook? =
        localDataSource.getRentalBookById(rentalId)
}
