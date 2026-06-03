package com.example.seoroseoga.data.local

import android.content.Context
import com.example.seoroseoga.data.local.db.JsonFileStore
import com.example.seoroseoga.data.model.MyBook
import org.json.JSONArray
import org.json.JSONObject

class MyBookLocalDataSource(
    context: Context
) {
    private val jsonFileStore = JsonFileStore(
        context = context,
        fileName = MY_BOOK_DB_FILE_NAME,
        defaultJson = createDefaultJson()
    )

    fun addMyBook(
        title: String,
        author: String,
        publisher: String,
        coverImageUri: String?
    ): MyBook {
        val json = jsonFileStore.read()
        val myBooks = json.getJSONArray(KEY_MY_BOOKS).toMyBooks()
        val addedAtMillis = System.currentTimeMillis()
        val myBook = MyBook(
            myBookId = "mybook-$addedAtMillis",
            title = title,
            author = author,
            publisher = publisher,
            coverImageUri = coverImageUri,
            addedAtMillis = addedAtMillis
        )

        val updatedBooks = JSONArray()
        myBooks.forEach { updatedBooks.put(it.toJson()) }
        updatedBooks.put(myBook.toJson())

        json.put(KEY_MY_BOOKS, updatedBooks)
        jsonFileStore.write(json)

        return myBook
    }

    fun getMyBooks(): List<MyBook> =
        jsonFileStore.read()
            .getJSONArray(KEY_MY_BOOKS)
            .toMyBooks()

    private fun JSONArray.toMyBooks(): List<MyBook> =
        (0 until length()).map { index ->
            getJSONObject(index).toMyBook()
        }

    private fun JSONObject.toMyBook(): MyBook =
        MyBook(
            myBookId = getString(KEY_MY_BOOK_ID),
            title = getString(KEY_TITLE),
            author = getString(KEY_AUTHOR),
            publisher = optString(KEY_PUBLISHER),
            coverImageUri = optString(KEY_COVER_IMAGE_URI).takeIf { it.isNotBlank() },
            addedAtMillis = getLong(KEY_ADDED_AT_MILLIS)
        )

    private fun MyBook.toJson(): JSONObject =
        JSONObject()
            .put(KEY_MY_BOOK_ID, myBookId)
            .put(KEY_TITLE, title)
            .put(KEY_AUTHOR, author)
            .put(KEY_PUBLISHER, publisher)
            .put(KEY_COVER_IMAGE_URI, coverImageUri)
            .put(KEY_ADDED_AT_MILLIS, addedAtMillis)

    private companion object {
        const val MY_BOOK_DB_FILE_NAME = "my_books_db.json"
        const val KEY_MY_BOOKS = "myBooks"
        const val KEY_MY_BOOK_ID = "myBookId"
        const val KEY_TITLE = "title"
        const val KEY_AUTHOR = "author"
        const val KEY_PUBLISHER = "publisher"
        const val KEY_COVER_IMAGE_URI = "coverImageUri"
        const val KEY_ADDED_AT_MILLIS = "addedAtMillis"

        fun createDefaultJson(): JSONObject =
            JSONObject()
                .put(KEY_MY_BOOKS, JSONArray())
    }
}
