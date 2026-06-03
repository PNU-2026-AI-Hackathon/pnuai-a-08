package com.example.seoroseoga.data.local

import android.content.Context
import com.example.seoroseoga.data.local.db.JsonFileStore
import com.example.seoroseoga.data.model.Book
import com.example.seoroseoga.data.model.BorrowedBook
import com.example.seoroseoga.data.model.RentalBook
import org.json.JSONArray
import org.json.JSONObject

// 지금은 로컬 json 기반 저장소 기준이라 결국은 아마 엎어야 할 듯?

class BorrowedBookLocalDataSource(
    context: Context
) {
    private val jsonFileStore = JsonFileStore(
        context = context,
        fileName = BORROWED_BOOK_DB_FILE_NAME,
        defaultJson = createDefaultJson()
    )

    fun addBorrowedBook(rentalBook: RentalBook): BorrowedBook {
        val json = jsonFileStore.read()
        val borrowedBooks = json.getJSONArray(KEY_BORROWED_BOOKS)
            .toBorrowedBooks()

        val existingBook = borrowedBooks.firstOrNull {
            it.rentalBook.rentalId == rentalBook.rentalId
        }

        if (existingBook != null) {
            return existingBook
        }

        val borrowedBook = BorrowedBook(
            borrowedId = "borrowed-${rentalBook.rentalId}",
            rentalBook = rentalBook,
            borrowedAtMillis = System.currentTimeMillis()
        )

        val updatedBooks = JSONArray()
        borrowedBooks.forEach { updatedBooks.put(it.toJson()) }
        updatedBooks.put(borrowedBook.toJson())

        json.put(KEY_BORROWED_BOOKS, updatedBooks)
        jsonFileStore.write(json)

        return borrowedBook
    }

    fun getBorrowedBooks(): List<BorrowedBook> =
        jsonFileStore.read()
            .getJSONArray(KEY_BORROWED_BOOKS)
            .toBorrowedBooks()

    private fun BorrowedBook.toJson(): JSONObject =
        JSONObject()
            .put(KEY_BORROWED_ID, borrowedId)
            .put(KEY_RENTAL_BOOK, rentalBook.toJson())
            .put(KEY_BORROWED_AT_MILLIS, borrowedAtMillis)

    private fun RentalBook.toJson(): JSONObject =
        JSONObject()
            .put(KEY_RENTAL_ID, rentalId)
            .put(KEY_BOOK, book.toJson())
            .put(KEY_RANK, rank)
            .put(KEY_RENTAL_STATUS, rentalStatus)
            .put(KEY_RENTAL_FEE, rentalFee)
            .put(KEY_CONDITION, condition)
            .put(KEY_OWNER, owner)
            .put(KEY_LOCATION, location)
            .put(KEY_RATING, rating.toDouble())
            .put(KEY_REVIEW_COUNT, reviewCount)

    private fun Book.toJson(): JSONObject =
        JSONObject()
            .put(KEY_BOOK_ID, id)
            .put(KEY_TITLE, title)
            .put(KEY_AUTHOR, author)
            .put(KEY_IMAGE_RES, imageRes)
            .put(KEY_DESCRIPTION, description)

    private fun JSONArray.toBorrowedBooks(): List<BorrowedBook> =
        (0 until length()).map { index ->
            getJSONObject(index).toBorrowedBook()
        }

    private fun JSONObject.toBorrowedBook(): BorrowedBook =
        BorrowedBook(
            borrowedId = getString(KEY_BORROWED_ID),
            rentalBook = getJSONObject(KEY_RENTAL_BOOK).toRentalBook(),
            borrowedAtMillis = getLong(KEY_BORROWED_AT_MILLIS)
        )

    private fun JSONObject.toRentalBook(): RentalBook =
        RentalBook(
            rentalId = getString(KEY_RENTAL_ID),
            book = getJSONObject(KEY_BOOK).toBook(),
            rank = if (isNull(KEY_RANK)) null else getInt(KEY_RANK),
            rentalStatus = getString(KEY_RENTAL_STATUS),
            rentalFee = getString(KEY_RENTAL_FEE),
            condition = getString(KEY_CONDITION),
            owner = getString(KEY_OWNER),
            location = getString(KEY_LOCATION),
            rating = getDouble(KEY_RATING).toFloat(),
            reviewCount = getInt(KEY_REVIEW_COUNT)
        )

    private fun JSONObject.toBook(): Book =
        Book(
            id = getString(KEY_BOOK_ID),
            title = getString(KEY_TITLE),
            author = getString(KEY_AUTHOR),
            imageRes = getInt(KEY_IMAGE_RES),
            description = optString(KEY_DESCRIPTION)
        )

    private companion object {
        const val BORROWED_BOOK_DB_FILE_NAME = "borrowed_books_db.json"
        const val KEY_BORROWED_BOOKS = "borrowedBooks"
        const val KEY_BORROWED_ID = "borrowedId"
        const val KEY_RENTAL_BOOK = "rentalBook"
        const val KEY_BORROWED_AT_MILLIS = "borrowedAtMillis"
        const val KEY_RENTAL_ID = "rentalId"
        const val KEY_BOOK = "book"
        const val KEY_RANK = "rank"
        const val KEY_RENTAL_STATUS = "rentalStatus"
        const val KEY_RENTAL_FEE = "rentalFee"
        const val KEY_CONDITION = "condition"
        const val KEY_OWNER = "owner"
        const val KEY_LOCATION = "location"
        const val KEY_RATING = "rating"
        const val KEY_REVIEW_COUNT = "reviewCount"
        const val KEY_BOOK_ID = "id"
        const val KEY_TITLE = "title"
        const val KEY_AUTHOR = "author"
        const val KEY_IMAGE_RES = "imageRes"
        const val KEY_DESCRIPTION = "description"

        fun createDefaultJson(): JSONObject =
            JSONObject()
                .put(KEY_BORROWED_BOOKS, JSONArray())
    }
}
