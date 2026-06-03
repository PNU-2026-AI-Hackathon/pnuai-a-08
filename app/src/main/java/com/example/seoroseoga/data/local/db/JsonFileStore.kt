package com.example.seoroseoga.data.local.db

import android.content.Context
import org.json.JSONObject
import java.io.File

class JsonFileStore(
    context: Context,
    fileName: String,
    private val defaultJson: JSONObject
) {
    private val dbDirectory = File(context.filesDir, DB_DIRECTORY_NAME)
    private val dbFile = File(dbDirectory, fileName)

    fun read(): JSONObject {
        ensureFileExists()
        return runCatching {
            JSONObject(dbFile.readText())
        }.getOrElse {
            defaultJson.also { write(it) }
        }
    }

    fun write(json: JSONObject) {
        ensureDirectoryExists()
        dbFile.writeText(json.toString(2))
    }

    private fun ensureFileExists() {
        ensureDirectoryExists()
        if (!dbFile.exists()) {
            dbFile.writeText(defaultJson.toString(2))
        }
    }

    private fun ensureDirectoryExists() {
        if (!dbDirectory.exists()) {
            dbDirectory.mkdirs()
        }
    }

    private companion object {
        const val DB_DIRECTORY_NAME = "seoroseoga_db"
    }
}
