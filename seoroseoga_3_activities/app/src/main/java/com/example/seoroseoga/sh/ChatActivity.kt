package com.example.seoroseoga.sh

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.seoroseoga.sh.data.MeetingRepository
import com.example.seoroseoga.sh.ui.MeetingChatScreen

class ChatActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val chatRoomId = intent.getStringExtra(EXTRA_CHAT_ROOM_ID).orEmpty()
        val userPrefs = UserPrefs(this)
        val repository = runCatching { MeetingRepository(userPrefs = userPrefs) }.getOrNull()

        setContent {
            MaterialTheme {
                MeetingChatScreen(
                    chatRoomId = chatRoomId,
                    repository = repository,
                    currentUserId = userPrefs.getOrCreateUserId(),
                    onBackClick = { finish() }
                )
            }
        }
    }

    companion object {
        const val EXTRA_CHAT_ROOM_ID = "chatRoomId"
    }
}
