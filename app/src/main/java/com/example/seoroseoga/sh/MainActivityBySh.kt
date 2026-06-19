package com.example.seoroseoga.sh

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.example.seoroseoga.R
import com.example.seoroseoga.sh.data.BookRecognitionModule
import com.example.seoroseoga.sh.data.GeminiChatModule
import com.example.seoroseoga.sh.data.KakaoLocalModule
import com.example.seoroseoga.sh.data.MeetingRepository
import com.example.seoroseoga.sh.model.AIGuide
import com.example.seoroseoga.sh.model.Meeting
import com.example.seoroseoga.sh.model.MyBook
import com.example.seoroseoga.sh.model.ReadingComment
import com.example.seoroseoga.sh.ui.AiChatScreen
import com.example.seoroseoga.sh.ui.AiGuideScreen
import com.example.seoroseoga.sh.ui.HomeScreen
import com.example.seoroseoga.sh.ui.JoinedMeetingDetailScreen
import com.example.seoroseoga.sh.ui.MeetRegScreen
import com.example.seoroseoga.sh.ui.MeetingChatScreen
import com.example.seoroseoga.sh.ui.MyPageScreen
import com.example.seoroseoga.sh.ui.ParticipateScreen
import kotlinx.coroutines.launch

class MainActivityBySh : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val userPrefs = UserPrefs(this)
        val repository = runCatching { MeetingRepository(userPrefs = userPrefs) }.getOrNull()
        val recognitionModule = BookRecognitionModule(this)
        val geminiChatModule = GeminiChatModule()
        val kakaoLocalModule = KakaoLocalModule()
        setContent {
            MaterialTheme {
                SeoroSeogaShApp(
                    userPrefs = userPrefs,
                    repository = repository,
                    recognitionModule = recognitionModule,
                    geminiChatModule = geminiChatModule,
                    kakaoLocalModule = kakaoLocalModule,
                    firestoreError = if (repository == null) "Firebase 설정이 필요합니다. google-services.json 추가 후 google-services 플러그인을 켜세요." else null
                )
            }
        }
    }
}

private sealed interface ShScreen {
    data object Home : ShScreen
    data object MeetReg : ShScreen
    data class Participate(val meetingId: String) : ShScreen
    data class Chat(val chatRoomId: String) : ShScreen
    data object MyPage : ShScreen
    data class JoinedMeetingDetail(val meetingId: String) : ShScreen
    data class AiGuide(val guide: AIGuide) : ShScreen
    data class AiChat(val guide: AIGuide) : ShScreen
}

@Composable
private fun SeoroSeogaShApp(
    userPrefs: UserPrefs,
    repository: MeetingRepository?,
    recognitionModule: BookRecognitionModule,
    geminiChatModule: GeminiChatModule,
    kakaoLocalModule: KakaoLocalModule,
    firestoreError: String?
) {
    var screen by remember { mutableStateOf<ShScreen>(ShScreen.Home) }
    var weeklyMeetings by remember { mutableStateOf<List<Meeting>>(emptyList()) }
    var joinedMeetings by remember { mutableStateOf<List<Meeting>>(emptyList()) }
    var errorMessage by remember { mutableStateOf(firestoreError) }
    var selectedMeeting by remember { mutableStateOf<Meeting?>(null) }
    val myBooks = remember { mutableStateListOf(*sampleMyBooks().toTypedArray()) }

    DisposableEffect(repository) {
        val weeklyRegistration = repository?.listenWeeklyMeetings(
            onChanged = {
                weeklyMeetings = it
                if (firestoreError == null) errorMessage = null
            },
            onError = { errorMessage = it.message }
        )
        val joinedRegistration = repository?.listenMyJoinedMeetings(
            onChanged = {
                joinedMeetings = it
                if (firestoreError == null) errorMessage = null
            },
            onError = { errorMessage = it.message }
        )
        onDispose {
            weeklyRegistration?.remove()
            joinedRegistration?.remove()
        }
    }

    when (val current = screen) {
        ShScreen.Home -> HomeScreen(
            meetings = weeklyMeetings,
            aiGuides = sampleAiGuides(),
            errorMessage = errorMessage,
            onCreateMeetingClick = { screen = ShScreen.MeetReg },
            onMeetingClick = {
                selectedMeeting = it
                screen = ShScreen.Participate(it.meetingId)
            },
            onAiGuideClick = { screen = ShScreen.AiGuide(it) },
            onMyPageClick = { screen = ShScreen.MyPage }
        )

        ShScreen.MeetReg -> MeetRegScreen(
            recognitionModule = recognitionModule,
            kakaoLocalModule = kakaoLocalModule,
            onBackClick = { screen = ShScreen.Home },
            onCreateMeeting = { input, onDone, onError ->
                if (repository == null) {
                    onError("Firebase 설정이 필요합니다.")
                } else {
                    kotlinx.coroutines.MainScope().launch {
                        runCatching { repository.createMeeting(input) }
                            .onSuccess {
                                onDone()
                                screen = ShScreen.Home
                            }
                            .onFailure { onError(it.message ?: "모임 생성 실패") }
                    }
                }
            }
        )

        is ShScreen.Participate -> {
            var meeting by remember(current.meetingId) {
                mutableStateOf(selectedMeeting?.takeIf { it.meetingId == current.meetingId })
            }
            LaunchedEffect(current.meetingId, repository) {
                runCatching { repository?.getMeetingDetail(current.meetingId) }
                    .onSuccess { if (it != null) meeting = it }
                    .onFailure { errorMessage = it.message }
            }
            ParticipateScreen(
                meeting = meeting,
                savedDisplayName = userPrefs.getDisplayName(),
                currentUserId = userPrefs.getOrCreateUserId(),
                onBackClick = { screen = ShScreen.Home },
                onJoinClick = { displayName, onError ->
                    if (repository == null) {
                        onError("Firebase 설정이 필요합니다.")
                    } else {
                        kotlinx.coroutines.MainScope().launch {
                            runCatching { repository.joinMeeting(current.meetingId, displayName) }
                                .onSuccess { joined ->
                                    val chatRoomId = joined?.chatRoomId ?: meeting?.chatRoomId
                                    if (!chatRoomId.isNullOrBlank()) screen = ShScreen.Chat(chatRoomId)
                                }
                                .onFailure { onError(it.message ?: "참가 신청 실패") }
                        }
                    }
                }
            )
        }

        is ShScreen.Chat -> MeetingChatScreen(
            chatRoomId = current.chatRoomId,
            repository = repository,
            currentUserId = userPrefs.getOrCreateUserId(),
            onBackClick = { screen = ShScreen.Home }
        )

        ShScreen.MyPage -> MyPageScreen(
            meetings = joinedMeetings,
            myBooks = myBooks,
            onBackClick = { screen = ShScreen.Home },
            onMeetingClick = {
                selectedMeeting = it
                screen = ShScreen.JoinedMeetingDetail(it.meetingId)
            }
        )

        is ShScreen.JoinedMeetingDetail -> {
            var meeting by remember(current.meetingId) {
                mutableStateOf(selectedMeeting?.takeIf { it.meetingId == current.meetingId })
            }
            LaunchedEffect(current.meetingId, repository) {
                runCatching { repository?.getMeetingDetail(current.meetingId) }
                    .onSuccess { if (it != null) meeting = it }
                    .onFailure { errorMessage = it.message }
            }
            JoinedMeetingDetailScreen(
                meeting = meeting,
                onBackClick = { screen = ShScreen.MyPage },
                onEnterChatClick = { chatRoomId -> screen = ShScreen.Chat(chatRoomId) }
            )
        }

        is ShScreen.AiGuide -> AiGuideScreen(
            guide = current.guide,
            onBackClick = { screen = ShScreen.Home },
            onAiChatClick = { screen = ShScreen.AiChat(current.guide) }
        )

        is ShScreen.AiChat -> AiChatScreen(
            guide = current.guide,
            geminiChatModule = geminiChatModule,
            onBackClick = { screen = ShScreen.AiGuide(current.guide) }
        )
    }
}

private fun sampleMyBooks(): List<MyBook> = listOf(
    MyBook("my-book-1", "역행자", "자청", "웅진지식하우스", addedAtMillis = System.currentTimeMillis()),
    MyBook("my-book-2", "아주 작은 습관의 힘", "제임스 클리어", "비즈니스북스", addedAtMillis = System.currentTimeMillis())
)

@Suppress("unused")
private fun sampleReadingComments(): List<ReadingComment> = listOf(
    ReadingComment("민서", "문장이 좋아서 오래 기억에 남아요.", 12),
    ReadingComment("지윤", "독서모임 질문으로 써도 좋을 것 같아요.", 4)
)

private fun sampleAiGuides(): List<AIGuide> = listOf(
    AIGuide(
        id = "ai-book-1",
        title = "역행자",
        author = "자청",
        imageRes = R.drawable.book_reverse,
        matchRate = 96,
        reason = "최근 자기계발과 실행력에 관심 있는 사용자에게 맞는 추천입니다.",
        tags = listOf("자기계발", "실행", "습관"),
        readingTime = "예상 5시간",
        backgroundKnowledge = listOf("저자의 경험과 실행 방법을 연결하며 읽으면 좋습니다."),
        keywords = listOf("자의식", "실행", "경제적 자유"),
        bookQuestions = listOf("지금 바로 바꿀 수 있는 작은 행동은 무엇인가요?"),
        discussionTopics = listOf("성공 경험을 일반화한 조언은 어디까지 유효할까요?"),
        aiPrompts = listOf("이 책의 핵심 내용을 5문장으로 요약해줘.")
    ),
    AIGuide(
        id = "ai-book-2",
        title = "아주 작은 습관의 힘",
        author = "제임스 클리어",
        imageRes = R.drawable.book_habit,
        matchRate = 94,
        reason = "반복 가능한 행동 설계에 초점을 맞춘 책입니다.",
        tags = listOf("루틴", "습관형성", "목표관리"),
        readingTime = "예상 6시간",
        backgroundKnowledge = listOf("습관은 신호, 갈망, 반응, 보상의 구조로 설명됩니다."),
        keywords = listOf("습관 루프", "환경 설계", "정체성"),
        bookQuestions = listOf("좋은 습관을 방해하는 환경은 무엇인가요?"),
        discussionTopics = listOf("작은 변화가 큰 결과를 만든다는 주장에 동의하나요?"),
        aiPrompts = listOf("내 일정에 맞는 습관 루틴을 추천해줘.")
    ),
    AIGuide(
        id = "ai-book-3",
        title = "미디어의 이해",
        author = "마셜 맥루한",
        imageRes = R.drawable.book_media,
        matchRate = 89,
        reason = "AI와 미디어 환경을 비판적으로 보고 싶은 사용자에게 맞습니다.",
        tags = listOf("미디어", "사회", "비판적 사고"),
        readingTime = "예상 7시간",
        backgroundKnowledge = listOf("매체가 사고 구조를 바꾼다는 관점을 중심으로 읽습니다."),
        keywords = listOf("매체", "정보", "비판적 사용"),
        bookQuestions = listOf("매체는 정보를 전달하나요, 사고방식을 바꾸나요?"),
        discussionTopics = listOf("AI 시대의 미디어 리터러시는 무엇일까요?"),
        aiPrompts = listOf("이 책의 주요 개념을 쉬운 예시로 설명해줘.")
    )
)


