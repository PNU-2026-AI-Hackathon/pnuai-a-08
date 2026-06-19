package com.example.seoroseoga.sh.data

import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.os.Environment
import com.example.seoroseoga.R
import com.example.seoroseoga.sh.model.BookInfo
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions
import com.google.mlkit.vision.text.TextRecognition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL

class BookRecognitionModule(private val context: Context) {
    suspend fun extractBookTitleFromImage(imageUri: Uri): String = withContext(Dispatchers.IO) {
        val image = InputImage.fromFilePath(context, imageUri)
        val recognizer = TextRecognition.getClient(KoreanTextRecognizerOptions.Builder().build())
        val result = recognizer.process(image).await()
        result.textBlocks
            .flatMap { it.lines }
            .map { it.text.trim() }
            .filter { it.length >= 2 }
            .maxByOrNull { it.length }
            .orEmpty()
    }


    suspend fun extractBookTitleCandidatesFromImage(imageUri: Uri): List<String> = withContext(Dispatchers.IO) {
        val image = InputImage.fromFilePath(context, imageUri)
        val recognizer = TextRecognition.getClient(KoreanTextRecognizerOptions.Builder().build())
        val result = recognizer.process(image).await()
        result.textBlocks
            .flatMap { it.lines }
            .map { it.text.trim() }
            .map { it.replace(Regex("\\s+"), " ") }
            .filter { it.length >= 2 }
            .distinct()
            .sortedWith(
                compareByDescending<String> { scoreTitleCandidate(it) }
                    .thenByDescending { it.length }
            )
            .take(12)
    }

    private fun scoreTitleCandidate(text: String): Int {
        var score = 0
        if (text.length in 2..18) score += 4
        if (text.any { it in '가'..'힣' }) score += 3
        if (text.any { it.isDigit() }) score -= 1
        if (text.contains(Regex("출판|지은이|옮김|ISBN|가격|원$"))) score -= 4
        if (text.count { it.isLetterOrDigit() || it in '가'..'힣' } < text.length / 2) score -= 2
        return score
    }

    suspend fun searchBooksByTitle(title: String): List<BookInfo> = withContext(Dispatchers.IO) {
        if (title.isBlank()) return@withContext emptyList()
        val encoded = URLEncoder.encode(title, "UTF-8")
        val apiKey = context.getString(R.string.google_api_key)
        val keyQuery = if (apiKey.isBlank()) "" else "&key=$apiKey"
        val connection = (URL("https://www.googleapis.com/books/v1/volumes?q=$encoded$keyQuery").openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 10_000
            readTimeout = 10_000
            setRequestProperty("Accept", "application/json")
        }
        val responseCode = connection.responseCode
        val stream = if (responseCode in 200..299) connection.inputStream else connection.errorStream
        val json = stream.bufferedReader().use { it.readText() }
        if (responseCode !in 200..299) {
            throw IllegalStateException("Google Books HTTP $responseCode: ${json.take(180)}")
        }
        val root = JSONObject(json)
        val items = root.optJSONArray("items") ?: return@withContext emptyList()
        buildList {
            for (index in 0 until minOf(items.length(), 10)) {
                val volume = items.optJSONObject(index)?.optJSONObject("volumeInfo") ?: continue
                val authors = volume.optJSONArray("authors")
                val industryIds = volume.optJSONArray("industryIdentifiers")
                add(
                    BookInfo(
                        bookTitle = volume.optString("title"),
                        bookAuthor = if (authors != null && authors.length() > 0) authors.optString(0) else "",
                        bookImageUrl = volume.optJSONObject("imageLinks")?.optString("thumbnail")?.replace("http://", "https://"),
                        bookDescription = volume.optString("description"),
                        bookIsbn = industryIds?.optJSONObject(0)?.optString("identifier")
                    )
                )
            }
        }
    }

    fun downloadBookImage(bookImageUrl: String): String {
        val request = DownloadManager.Request(Uri.parse(bookImageUrl))
            .setTitle("book_cover")
            .setDescription("Downloading book cover")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_PICTURES, "book_${System.currentTimeMillis()}.jpg")
        val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val downloadId = manager.enqueue(request)
        return "download://$downloadId"
    }
}




