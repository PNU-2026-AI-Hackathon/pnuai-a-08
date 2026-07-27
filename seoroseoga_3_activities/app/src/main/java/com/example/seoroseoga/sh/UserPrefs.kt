package com.example.seoroseoga.sh

import android.content.Context
import java.util.UUID

class UserPrefs(context: Context) {
    private val prefs = context.getSharedPreferences("app", Context.MODE_PRIVATE)

    fun getOrCreateUserId(): String {
        val existing = prefs.getString(KEY_USER_ID, null)
        if (existing != null) return existing
        val created = UUID.randomUUID().toString()
        prefs.edit().putString(KEY_USER_ID, created).apply()
        return created
    }

    fun getDisplayName(): String = prefs.getString(KEY_DISPLAY_NAME, "") ?: ""

    fun saveDisplayName(displayName: String) {
        prefs.edit().putString(KEY_DISPLAY_NAME, displayName).apply()
    }

    companion object {
        private const val KEY_USER_ID = "userId"
        private const val KEY_DISPLAY_NAME = "displayName"
    }
}
