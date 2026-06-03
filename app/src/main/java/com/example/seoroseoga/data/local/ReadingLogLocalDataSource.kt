package com.example.seoroseoga.data.local

import android.content.Context
import com.example.seoroseoga.data.local.db.JsonFileStore
import com.example.seoroseoga.data.model.ReadingBookSource
import com.example.seoroseoga.data.model.ReadingComment
import com.example.seoroseoga.data.model.ReadingLog
import org.json.JSONArray
import org.json.JSONObject

class ReadingLogLocalDataSource(
    context: Context
) {
    private val jsonFileStore = JsonFileStore(
        context = context,
        fileName = READING_LOG_DB_FILE_NAME,
        defaultJson = createDefaultJson()
    )

    fun getOrCreateReadingLog(
        source: ReadingBookSource,
        bookId: String,
        title: String,
        author: String,
        coverImageUri: String?,
        coverImageRes: Int?
    ): ReadingLog {
        val existingLog = getReadingLog(source, bookId)
        if (existingLog != null) {
            return existingLog
        }

        val now = System.currentTimeMillis()
        val readingLog = ReadingLog(
            readingLogId = createReadingLogId(source, bookId),
            source = source,
            bookId = bookId,
            title = title,
            author = author,
            coverImageUri = coverImageUri,
            coverImageRes = coverImageRes,
            updatedAtMillis = now
        )

        val json = jsonFileStore.read()
        val logs = json.getJSONArray(KEY_READING_LOGS)
        logs.put(readingLog.toJson())
        jsonFileStore.write(json)

        return readingLog
    }

    fun updatePage(
        source: ReadingBookSource,
        bookId: String,
        currentPage: Int,
        totalPage: Int
    ): ReadingLog? =
        updateReadingLog(source, bookId) { log ->
            val safeTotalPage = totalPage.coerceAtLeast(1)
            log.copy(
                currentPage = currentPage.coerceIn(0, safeTotalPage),
                totalPage = safeTotalPage,
                updatedAtMillis = System.currentTimeMillis()
            )
        }

    fun updateQuote(
        source: ReadingBookSource,
        bookId: String,
        quote: String
    ): ReadingLog? =
        updateReadingLog(source, bookId) { log ->
            log.copy(
                quote = quote,
                updatedAtMillis = System.currentTimeMillis()
            )
        }

    fun updateReview(
        source: ReadingBookSource,
        bookId: String,
        review: String
    ): ReadingLog? =
        updateReadingLog(source, bookId) { log ->
            log.copy(
                review = review,
                updatedAtMillis = System.currentTimeMillis()
            )
        }

    fun getMockComments(): List<ReadingComment> = listOf(
        ReadingComment(
            commenterName = "김예은",
            text = "저도 비슷한 부분이 가장 기억에 남았어요.",
            likeCount = 12
        ),
        ReadingComment(
            commenterName = "이서준",
            text = "주인공의 선택이 인상적이었네요.",
            likeCount = 8
        ),
        ReadingComment(
            commenterName = "박지훈",
            text = "같은 부분에서 생각할 거리가 많았어요.",
            likeCount = 6
        )
    )

    private fun getReadingLog(
        source: ReadingBookSource,
        bookId: String
    ): ReadingLog? =
        jsonFileStore.read()
            .getJSONArray(KEY_READING_LOGS)
            .toReadingLogs()
            .firstOrNull { it.source == source && it.bookId == bookId }

    private fun updateReadingLog(
        source: ReadingBookSource,
        bookId: String,
        transform: (ReadingLog) -> ReadingLog
    ): ReadingLog? {
        val json = jsonFileStore.read()
        val logs = json.getJSONArray(KEY_READING_LOGS).toReadingLogs()
        var updatedLog: ReadingLog? = null

        val updatedLogs = JSONArray()
        logs.forEach { log ->
            val nextLog = if (log.source == source && log.bookId == bookId) {
                transform(log).also { updatedLog = it }
            } else {
                log
            }
            updatedLogs.put(nextLog.toJson())
        }

        json.put(KEY_READING_LOGS, updatedLogs)
        jsonFileStore.write(json)

        return updatedLog
    }

    private fun ReadingLog.toJson(): JSONObject =
        JSONObject()
            .put(KEY_READING_LOG_ID, readingLogId)
            .put(KEY_SOURCE, source.name)
            .put(KEY_BOOK_ID, bookId)
            .put(KEY_TITLE, title)
            .put(KEY_AUTHOR, author)
            .put(KEY_COVER_IMAGE_URI, coverImageUri)
            .put(KEY_COVER_IMAGE_RES, coverImageRes)
            .put(KEY_CURRENT_PAGE, currentPage)
            .put(KEY_TOTAL_PAGE, totalPage)
            .put(KEY_QUOTE, quote)
            .put(KEY_REVIEW, review)
            .put(KEY_UPDATED_AT_MILLIS, updatedAtMillis)

    private fun JSONArray.toReadingLogs(): List<ReadingLog> =
        (0 until length()).map { index ->
            getJSONObject(index).toReadingLog()
        }

    private fun JSONObject.toReadingLog(): ReadingLog =
        ReadingLog(
            readingLogId = getString(KEY_READING_LOG_ID),
            source = optString(KEY_SOURCE).toReadingBookSource(),
            bookId = getString(KEY_BOOK_ID),
            title = getString(KEY_TITLE),
            author = getString(KEY_AUTHOR),
            coverImageUri = optString(KEY_COVER_IMAGE_URI).takeIf { it.isNotBlank() },
            coverImageRes = if (isNull(KEY_COVER_IMAGE_RES)) null else getInt(KEY_COVER_IMAGE_RES),
            currentPage = getInt(KEY_CURRENT_PAGE),
            totalPage = getInt(KEY_TOTAL_PAGE),
            quote = optString(KEY_QUOTE),
            review = optString(KEY_REVIEW),
            updatedAtMillis = getLong(KEY_UPDATED_AT_MILLIS)
        )

    private fun String.toReadingBookSource(): ReadingBookSource =
        runCatching { ReadingBookSource.valueOf(this) }
            .getOrDefault(ReadingBookSource.MY_BOOK)

    private fun createReadingLogId(
        source: ReadingBookSource,
        bookId: String
    ): String = "reading-${source.name.lowercase()}-$bookId"

    private companion object {
        const val READING_LOG_DB_FILE_NAME = "reading_logs_db.json"
        const val KEY_READING_LOGS = "readingLogs"
        const val KEY_READING_LOG_ID = "readingLogId"
        const val KEY_SOURCE = "source"
        const val KEY_BOOK_ID = "bookId"
        const val KEY_TITLE = "title"
        const val KEY_AUTHOR = "author"
        const val KEY_COVER_IMAGE_URI = "coverImageUri"
        const val KEY_COVER_IMAGE_RES = "coverImageRes"
        const val KEY_CURRENT_PAGE = "currentPage"
        const val KEY_TOTAL_PAGE = "totalPage"
        const val KEY_QUOTE = "quote"
        const val KEY_REVIEW = "review"
        const val KEY_UPDATED_AT_MILLIS = "updatedAtMillis"

        fun createDefaultJson(): JSONObject =
            JSONObject()
                .put(KEY_READING_LOGS, JSONArray())
    }
}
