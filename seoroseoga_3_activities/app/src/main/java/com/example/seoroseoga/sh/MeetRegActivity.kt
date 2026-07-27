package com.example.seoroseoga.sh

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import com.example.seoroseoga.sh.data.BookRecognitionModule
import com.example.seoroseoga.sh.data.KakaoLocalModule
import com.example.seoroseoga.sh.data.MeetingRepository
import com.example.seoroseoga.sh.ui.MeetRegScreen
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch

class MeetRegActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val userPrefs = UserPrefs(this)
        val repository = runCatching { MeetingRepository(userPrefs = userPrefs) }.getOrNull()
        val recognitionModule = BookRecognitionModule(this)
        val kakaoLocalModule = KakaoLocalModule()

        setContent {
            MaterialTheme {
                MeetRegScreen(
                    recognitionModule = recognitionModule,
                    kakaoLocalModule = kakaoLocalModule,
                    onBackClick = { finish() },
                    onCreateMeeting = { input, onDone, onError ->
                        if (repository == null) {
                            onError("Firebase 설정이 필요합니다.")
                        } else {
                            MainScope().launch {
                                runCatching { repository.createMeeting(input) }
                                    .onSuccess {
                                        onDone()
                                        finish()
                                    }
                                    .onFailure { onError(it.message ?: "모임 생성 실패") }
                            }
                        }
                    }
                )
            }
        }
    }
}
