package com.example.seoroseoga.sh

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.example.seoroseoga.sh.data.MeetingRepository
import com.example.seoroseoga.sh.model.Meeting
import com.example.seoroseoga.sh.ui.ParticipateScreen
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch

class ParticipateActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val meetingId = intent.getStringExtra(EXTRA_MEETING_ID).orEmpty()
        val userPrefs = UserPrefs(this)
        val repository = runCatching { MeetingRepository(userPrefs = userPrefs) }.getOrNull()

        setContent {
            MaterialTheme {
                var meeting by remember(meetingId) { mutableStateOf<Meeting?>(null) }

                LaunchedEffect(meetingId, repository) {
                    if (meetingId.isNotBlank()) {
                        runCatching { repository?.getMeetingDetail(meetingId) }
                            .onSuccess { if (it != null) meeting = it }
                    }
                }

                ParticipateScreen(
                    meeting = meeting,
                    savedDisplayName = userPrefs.getDisplayName(),
                    currentUserId = userPrefs.getOrCreateUserId(),
                    onBackClick = { finish() },
                    onJoinClick = { displayName, onError ->
                        if (repository == null) {
                            onError("Firebase 설정이 필요합니다.")
                        } else {
                            MainScope().launch {
                                runCatching { repository.joinMeeting(meetingId, displayName) }
                                    .onSuccess { joined ->
                                        val chatRoomId = joined?.chatRoomId ?: meeting?.chatRoomId
                                        if (!chatRoomId.isNullOrBlank()) {
                                            startActivity(
                                                Intent(this@ParticipateActivity, ChatActivity::class.java)
                                                    .putExtra(ChatActivity.EXTRA_CHAT_ROOM_ID, chatRoomId)
                                            )
                                        }
                                    }
                                    .onFailure { onError(it.message ?: "참가 신청 실패") }
                            }
                        }
                    }
                )
            }
        }
    }

    companion object {
        const val EXTRA_MEETING_ID = "meetingId"
    }
}
