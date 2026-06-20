package com.example.seoroseoga.sh.ui

import android.content.Context
import android.content.Intent
import android.app.DownloadManager
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Environment
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.Button
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.seoroseoga.R
import com.example.seoroseoga.sh.data.BookRecognitionModule
import com.example.seoroseoga.sh.data.GeminiChatModule
import com.example.seoroseoga.sh.data.KakaoLocalModule
import com.example.seoroseoga.sh.data.MeetingCreateInput
import com.example.seoroseoga.sh.data.MeetingRepository
import com.example.seoroseoga.sh.model.AiChatMessage
import com.example.seoroseoga.sh.model.AIGuide
import com.example.seoroseoga.sh.model.BookInfo
import com.example.seoroseoga.sh.model.KakaoPlace
import com.example.seoroseoga.sh.model.Meeting
import com.example.seoroseoga.sh.model.MeetingMessage
import com.example.seoroseoga.sh.model.MyBook
import com.example.seoroseoga.sh.model.ReadingLog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.security.MessageDigest
import java.net.URLEncoder
import java.net.URL

private val Olive = Color(0xFF38BDF8)
private val Pale = Color(0xFFF0F9FF)
private val Ink = Color(0xFF0F172A)
private const val BookCoverDownloadPrefs = "book_cover_downloads"

@Composable
fun HomeScreen(
    meetings: List<Meeting>,
    aiGuides: List<AIGuide>,
    errorMessage: String?,
    onCreateMeetingClick: () -> Unit,
    onMeetingClick: (Meeting) -> Unit,
    onAiGuideClick: (AIGuide) -> Unit,
    onMyPageClick: () -> Unit
) {
    Scaffold(bottomBar = { BottomBar(onHomeClick = {}, onMyPageClick = onMyPageClick) }, containerColor = Color.White) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            item {
                Spacer(Modifier.height(8.dp))
                Header("서로서가", "책에 대한 생각을 부산대 학생들과 나눠보세요")
                if (!errorMessage.isNullOrBlank()) InfoBox(errorMessage)
            }
            item {
                SectionHeader("금주의 독서모임", "모임 만들기", onCreateMeetingClick)
                Spacer(Modifier.height(10.dp))
                if (meetings.isEmpty()) {
                    EmptyBox("아직 열려 있는 모임이 없습니다.")
                } else {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(meetings) { meeting -> MeetingCard(meeting, onMeetingClick) }
                    }
                }
            }
            item {
                SectionHeader("AI 추천 도서", null, {})
                Spacer(Modifier.height(10.dp))
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(aiGuides) { guide -> AiBookCard(guide, onAiGuideClick) }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MeetRegScreen(
    recognitionModule: BookRecognitionModule,
    kakaoLocalModule: KakaoLocalModule,
    onBackClick: () -> Unit,
    onCreateMeeting: (MeetingCreateInput, () -> Unit, (String) -> Unit) -> Unit
) {
    val scope = rememberCoroutineScope()
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var bookTitle by remember { mutableStateOf("") }
    var bookAuthor by remember { mutableStateOf("") }
    var bookImageUrl by remember { mutableStateOf<String?>(null) }
    var bookImageLocalUri by remember { mutableStateOf<String?>(null) }
    var bookDescription by remember { mutableStateOf<String?>(null) }
    var bookIsbn by remember { mutableStateOf<String?>(null) }
    var ocrCandidates by remember { mutableStateOf<List<String>>(emptyList()) }
    var candidates by remember { mutableStateOf<List<BookInfo>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var hostName by remember { mutableStateOf("") }
    var place by remember { mutableStateOf("") }
    var placeAddress by remember { mutableStateOf("") }
    var placeLatitude by remember { mutableStateOf<Double?>(null) }
    var placeLongitude by remember { mutableStateOf<Double?>(null) }
    var placeResults by remember { mutableStateOf<List<KakaoPlace>>(emptyList()) }
    var selectedPlace by remember { mutableStateOf<KakaoPlace?>(null) }
    var date by remember { mutableStateOf("") }
    var time by remember { mutableStateOf("") }
    var fee by remember { mutableStateOf("") }
    var maxParticipants by remember { mutableStateOf("4") }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }
    val datePickerState = rememberDatePickerState()
    val timePickerState = rememberTimePickerState(is24Hour = true)

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            selectedImageUri = uri
            loading = true
            error = null
            scope.launch {
                runCatching { recognitionModule.extractBookTitleCandidatesFromImage(uri) }
                    .onSuccess {
                        ocrCandidates = it
                        bookTitle = it.firstOrNull().orEmpty()
                    }
                    .onFailure { error = it.message ?: "OCR 실패" }
                loading = false
            }
        }
    }

    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { selectedMillis ->
                            date = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA).format(Date(selectedMillis))
                        }
                        showDatePicker = false
                    }
                ) { Text("확인") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("취소") }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }

    if (showTimePicker) {
        AlertDialog(
            onDismissRequest = { showTimePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        time = "%02d:%02d".format(timePickerState.hour, timePickerState.minute)
                        showTimePicker = false
                    }
                ) { Text("확인") }
            },
            dismissButton = {
                TextButton(onClick = { showTimePicker = false }) { Text("취소") }
            },
            text = { TimePicker(state = timePickerState) }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { TopBar("모임 만들기", onBackClick) }
        item {
            Button(onClick = { imagePicker.launch(arrayOf("image/*")) }, colors = primaryButtonColors(), shape = RoundedCornerShape(8.dp)) {
                Text(if (selectedImageUri == null) "책 사진 선택" else "책 사진 다시 선택")
            }
        }
        item { InputField("책 제목", bookTitle) { bookTitle = it } }
        if (ocrCandidates.isNotEmpty()) {
            item { Text("OCR 제목 후보", fontWeight = FontWeight.Bold, color = Ink) }
            items(ocrCandidates) { candidate ->
                OcrCandidateChip(candidate) { bookTitle = candidate }
            }
        }
        item {
            Button(
                onClick = {
                    loading = true
                    error = null
                    ocrCandidates = emptyList()
                    scope.launch {
                        runCatching { recognitionModule.searchBooksByTitle(bookTitle) }
                            .onSuccess { candidates = it }
                            .onFailure { throwable ->
                                error = "Google Books 검색 실패: ${throwable.message ?: throwable::class.java.simpleName}"
                            }
                        loading = false
                    }
                },
                colors = mutedButtonColors(),
                shape = RoundedCornerShape(8.dp)
            ) { Text("정보 불러오기") }
        }
        if (loading) item { CircularProgressIndicator(color = Olive) }
        if (!error.isNullOrBlank()) item { InfoBox(error.orEmpty()) }
        if (candidates.isNotEmpty()) {
            item { Text("책 후보", fontWeight = FontWeight.Bold, color = Ink) }
            items(candidates) { candidate ->
                CandidateCard(candidate) {
                    bookTitle = candidate.bookTitle
                    bookAuthor = candidate.bookAuthor
                    bookImageUrl = candidate.bookImageUrl
                    bookDescription = candidate.bookDescription
                    bookIsbn = candidate.bookIsbn
                    bookImageLocalUri = candidate.bookImageUrl?.let(recognitionModule::downloadBookImage)
                    candidates = emptyList()
                }
            }
        }
        item { InputField("저자", bookAuthor) { bookAuthor = it } }
        item { InputField("모임 제목", title) { title = it } }
        item { InputField("모임 설명", description) { description = it } }
        item { InputField("개설자 이름", hostName) { hostName = it } }
        item {
            InputField("장소 검색", place) {
                place = it
                selectedPlace = null
                placeAddress = ""
                placeLatitude = null
                placeLongitude = null
            }
        }
        item {
            Button(
                onClick = {
                    loading = true
                    error = null
                    scope.launch {
                        runCatching { kakaoLocalModule.searchPlaces(place) }
                            .onSuccess { results ->
                                placeResults = results
                                if (results.isEmpty()) error = "검색된 장소가 없습니다."
                            }
                            .onFailure { throwable ->
                                error = throwable.message ?: "카카오 장소 검색 실패"
                            }
                        loading = false
                    }
                },
                colors = mutedButtonColors(),
                shape = RoundedCornerShape(8.dp)
            ) { Text("카카오맵 장소 검색") }
        }
        if (placeResults.isNotEmpty()) {
            item { Text("카카오 장소 검색 결과", fontWeight = FontWeight.Bold, color = Ink) }
            items(placeResults) { candidate ->
                KakaoPlaceCard(candidate) {
                    place = candidate.name
                    placeAddress = candidate.address
                    placeLatitude = candidate.latitude
                    placeLongitude = candidate.longitude
                    selectedPlace = candidate
                    placeResults = emptyList()
                }
            }
        }
        selectedPlace?.let { placeInfo ->
            item {
                Text("선택한 장소", fontWeight = FontWeight.Bold, color = Ink)
                KakaoPlaceCard(placeInfo, onClick = {})
                KakaoMapPreview(
                    placeName = placeInfo.name,
                    address = placeInfo.address,
                    latitude = placeInfo.latitude,
                    longitude = placeInfo.longitude,
                    modifier = Modifier.fillMaxWidth().height(160.dp)
                )
            }
        }
        item { PickerField("날짜", date.ifBlank { "날짜 선택" }) { showDatePicker = true } }
        item { PickerField("시간", time.ifBlank { "시간 선택" }) { showTimePicker = true } }
        item { InputField("참가비", fee) { fee = it.filter(Char::isDigit) } }
        item { InputField("최대 인원", maxParticipants) { maxParticipants = it.filter(Char::isDigit) } }
        item {
            Button(
                enabled = !saving,
                onClick = {
                    saving = true
                    error = null
                    onCreateMeeting(
                        MeetingCreateInput(
                            title = title,
                            description = description,
                            hostName = hostName,
                            place = place,
                            placeAddress = placeAddress,
                            placeLatitude = placeLatitude,
                            placeLongitude = placeLongitude,
                            meetingDate = date,
                            meetingTime = time,
                            fee = fee.toIntOrNull() ?: 0,
                            maxParticipants = maxParticipants.toIntOrNull() ?: 2,
                            bookTitle = bookTitle,
                            bookAuthor = bookAuthor,
                            bookImageUrl = bookImageUrl,
                            bookImageLocalUri = bookImageLocalUri,
                            bookDescription = bookDescription,
                            bookIsbn = bookIsbn
                        ),
                        { saving = false },
                        {
                            saving = false
                            error = it
                        }
                    )
                },
                modifier = Modifier.fillMaxWidth(),
                colors = primaryButtonColors(),
                shape = RoundedCornerShape(8.dp)
            ) { Text(if (saving) "저장 중..." else "모임 생성하기") }
        }
    }
}

@Composable
fun ParticipateScreen(
    meeting: Meeting?,
    savedDisplayName: String,
    currentUserId: String,
    onBackClick: () -> Unit,
    onJoinClick: (String, (String) -> Unit) -> Unit
) {
    var displayName by remember(savedDisplayName) { mutableStateOf(savedDisplayName) }
    var error by remember { mutableStateOf<String?>(null) }
    DetailScaffold(title = "참가 신청", onBackClick = onBackClick) {
        if (meeting == null) {
            CircularProgressIndicator(color = Olive)
            return@DetailScaffold
        }
        MeetingDetail(meeting)
        if (meeting.participantIds.contains(currentUserId)) {
            InfoBox("이미 참가한 모임입니다. 버튼을 누르면 채팅방으로 이동합니다.")
        } else {
            InputField("참가자 이름", displayName) { displayName = it }
        }
        if (!error.isNullOrBlank()) InfoBox(error.orEmpty())
        Button(
            onClick = { onJoinClick(displayName.ifBlank { "익명" }) { error = it } },
            modifier = Modifier.fillMaxWidth(),
            colors = primaryButtonColors(),
            shape = RoundedCornerShape(8.dp)
        ) { Text("참가신청하기") }
    }
}

@Composable
fun MeetingChatScreen(
    chatRoomId: String,
    repository: MeetingRepository?,
    currentUserId: String,
    onBackClick: () -> Unit
) {
    var messages by remember { mutableStateOf<List<MeetingMessage>>(emptyList()) }
    var input by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    DisposableEffect(chatRoomId, repository) {
        val registration = repository?.listenMessages(chatRoomId, { messages = it }, { error = it.message })
        onDispose { registration?.remove() }
    }

    Scaffold(containerColor = Color.White) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            TopBar("모임 채팅", onBackClick)
            if (!error.isNullOrBlank()) InfoBox(error.orEmpty())
            LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(messages) { message -> MessageBubble(message, message.senderId == currentUserId) }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(value = input, onValueChange = { input = it }, modifier = Modifier.weight(1f), placeholder = { Text("메시지") })
                Spacer(Modifier.width(8.dp))
                Button(onClick = {
                    val text = input
                    input = ""
                    scope.launch { runCatching { repository?.sendMessage(chatRoomId, text) }.onFailure { error = it.message } }
                }, colors = primaryButtonColors(), shape = RoundedCornerShape(8.dp)) { Text("전송") }
            }
        }
    }
}

@Composable
fun MyPageScreen(
    meetings: List<Meeting>,
    myBooks: List<MyBook>,
    onBackClick: () -> Unit,
    onMeetingClick: (Meeting) -> Unit,
    onAddBookClick: () -> Unit,
    onMyBookClick: (MyBook) -> Unit
) {
    var selectedTab by remember { mutableStateOf(MyPageTab.Meetings) }

    DetailScaffold(title = "마이페이지", onBackClick = onBackClick) {
        MyPageTabs(selectedTab = selectedTab, onTabSelected = { selectedTab = it })
        when (selectedTab) {
            MyPageTab.Meetings -> {
                if (meetings.isEmpty()) {
                    EmptyBox("참가신청한 모임이 없습니다.")
                } else {
                    meetings.forEach { MeetingListRow(it, onMeetingClick) }
                }
            }
            MyPageTab.Library -> {
                MyBookList(
                    myBooks = myBooks,
                    onMyBookClick = onMyBookClick,
                    onAddBookClick = onAddBookClick
                )
            }
        }
    }
}

@Composable
fun AddMyBookScreen(
    recognitionModule: BookRecognitionModule,
    onBackClick: () -> Unit,
    onSaveClick: (
        title: String,
        author: String,
        publisher: String,
        coverImageUri: String?,
        bookImageUrl: String?,
        description: String?,
        isbn: String?,
        totalPage: Int
    ) -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var title by remember { mutableStateOf("") }
    var author by remember { mutableStateOf("") }
    var publisher by remember { mutableStateOf("") }
    var totalPage by remember { mutableStateOf("") }
    var bookImageUrl by remember { mutableStateOf<String?>(null) }
    var description by remember { mutableStateOf<String?>(null) }
    var isbn by remember { mutableStateOf<String?>(null) }
    var ocrCandidates by remember { mutableStateOf<List<String>>(emptyList()) }
    var bookCandidates by remember { mutableStateOf<List<BookInfo>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            runCatching {
                context.contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            }
            selectedImageUri = uri
            loading = true
            error = null
            scope.launch {
                runCatching { recognitionModule.extractBookTitleCandidatesFromImage(uri) }
                    .onSuccess {
                        ocrCandidates = it
                        title = it.firstOrNull().orEmpty()
                    }
                    .onFailure { error = it.message ?: "OCR 실패" }
                loading = false
            }
        }
    }

    DetailScaffold(title = "내 책 등록", onBackClick = onBackClick) {
        Button(
            onClick = { imagePicker.launch(arrayOf("image/*")) },
            colors = primaryButtonColors(),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text(if (selectedImageUri == null) "책 사진 선택" else "책 사진 다시 선택")
        }
        InputField("책 제목", title) { title = it }
        if (ocrCandidates.isNotEmpty()) {
            SectionLabel("OCR 제목 후보")
            ocrCandidates.forEach { candidate ->
                OcrCandidateChip(candidate) { title = candidate }
            }
        }
        Button(
            onClick = {
                loading = true
                error = null
                scope.launch {
                    runCatching { recognitionModule.searchBooksByTitle(title) }
                        .onSuccess { results ->
                            bookCandidates = results
                            if (results.isEmpty()) error = "검색된 책이 없습니다."
                        }
                        .onFailure { throwable ->
                            error = "Google Books 검색 실패: ${throwable.message ?: throwable::class.java.simpleName}"
                        }
                    loading = false
                }
            },
            enabled = title.isNotBlank() && !loading,
            colors = mutedButtonColors(),
            shape = RoundedCornerShape(8.dp)
        ) { Text("정보 불러오기") }

        if (loading) CircularProgressIndicator(color = Olive)
        if (!error.isNullOrBlank()) InfoBox(error.orEmpty())
        if (bookCandidates.isNotEmpty()) {
            SectionLabel("책 후보")
            bookCandidates.forEach { candidate ->
                CandidateCard(candidate) {
                    title = candidate.bookTitle
                    author = candidate.bookAuthor
                    publisher = candidate.publisher
                    totalPage = candidate.pageCount?.toString().orEmpty()
                    bookImageUrl = candidate.bookImageUrl
                    description = candidate.bookDescription
                    isbn = candidate.bookIsbn
                    bookCandidates = emptyList()
                }
            }
        }

        InputField("저자", author) { author = it }
        InputField("출판사", publisher) { publisher = it }
        InputField("전체 페이지", totalPage) { totalPage = it.filter(Char::isDigit) }
        Button(
            onClick = {
                onSaveClick(
                    title,
                    author,
                    publisher,
                    selectedImageUri?.toString(),
                    bookImageUrl,
                    description,
                    isbn,
                    totalPage.toIntOrNull()?.coerceAtLeast(1) ?: 300
                )
            },
            enabled = title.isNotBlank(),
            modifier = Modifier.fillMaxWidth(),
            colors = primaryButtonColors(),
            shape = RoundedCornerShape(8.dp)
        ) { Text("내 서재에 저장") }
    }
}

@Composable
fun ReadingLogScreen(
    readingLog: ReadingLog?,
    onBackClick: () -> Unit,
    onSavePage: (currentPage: Int, totalPage: Int) -> ReadingLog?,
    onSaveQuote: (quote: String) -> ReadingLog?,
    onSaveReview: (review: String) -> ReadingLog?
) {
    if (readingLog == null) {
        DetailScaffold(title = "독서 기록", onBackClick = onBackClick) {
            EmptyBox("독서 기록을 찾을 수 없습니다.")
        }
        return
    }

    var currentPage by remember(readingLog.readingLogId) { mutableStateOf(readingLog.currentPage) }
    var totalPageText by remember(readingLog.readingLogId) { mutableStateOf(readingLog.totalPage.toString()) }
    var directPageText by remember(readingLog.readingLogId) { mutableStateOf(readingLog.currentPage.toString()) }
    var quote by remember(readingLog.readingLogId) { mutableStateOf(readingLog.quote) }
    var review by remember(readingLog.readingLogId) { mutableStateOf(readingLog.review) }
    val totalPage = totalPageText.toIntOrNull()?.coerceAtLeast(1) ?: 1
    val progress = (currentPage.toFloat() / totalPage.toFloat()).coerceIn(0f, 1f)

    DetailScaffold(title = "독서 기록", onBackClick = onBackClick) {
        SectionLabel(readingLog.title)
        Text(readingLog.author, color = Color(0xFF666666), fontSize = 13.sp)
        ReadingProgressSection(
            currentPage = currentPage,
            totalPage = totalPage,
            progress = progress
        )
        PageRecordSection(
            totalPageText = totalPageText,
            directPageText = directPageText,
            onMinusClick = {
                currentPage = (currentPage - 1).coerceAtLeast(0)
                directPageText = currentPage.toString()
            },
            onPlusClick = {
                currentPage = (currentPage + 1).coerceAtMost(totalPage)
                directPageText = currentPage.toString()
            },
            onTotalPageChange = { totalPageText = it.filter(Char::isDigit) },
            onDirectPageChange = { directPageText = it.filter(Char::isDigit) },
            onSaveClick = {
                val nextTotalPage = totalPageText.toIntOrNull()?.coerceAtLeast(1) ?: 1
                val nextCurrentPage = directPageText.toIntOrNull()?.coerceIn(0, nextTotalPage) ?: currentPage
                onSavePage(nextCurrentPage, nextTotalPage)?.let {
                    currentPage = it.currentPage
                    totalPageText = it.totalPage.toString()
                    directPageText = it.currentPage.toString()
                }
            }
        )
        TextRecordSection(
            title = "인상 깊은 문장",
            value = quote,
            placeholder = "기억하고 싶은 문장을 입력하세요.",
            onValueChange = { quote = it },
            onSaveClick = { onSaveQuote(quote)?.let { quote = it.quote } }
        )
        TextRecordSection(
            title = "나의 감상",
            value = review,
            placeholder = "읽고 난 감상을 입력하세요.",
            onValueChange = { review = it },
            onSaveClick = { onSaveReview(review)?.let { review = it.review } }
        )
    }
}

private enum class MyPageTab(val label: String) {
    Meetings("참가신청한 모임"),
    Library("내 서재")
}

@Composable
private fun MyPageTabs(selectedTab: MyPageTab, onTabSelected: (MyPageTab) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        MyPageTab.values().forEach { tab ->
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(42.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (selectedTab == tab) Olive else Pale)
                    .clickable { onTabSelected(tab) },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    tab.label,
                    color = if (selectedTab == tab) Color.White else Color(0xFF555555),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

@Composable
private fun MyBookList(
    myBooks: List<MyBook>,
    onMyBookClick: (MyBook) -> Unit,
    onAddBookClick: () -> Unit
) {
    if (myBooks.isEmpty()) {
        EmptyBox("내 서재에 등록한 책이 없습니다.")
    } else {
        myBooks.forEach { myBook ->
            MyBookRowCard(myBook = myBook, onClick = { onMyBookClick(myBook) })
        }
    }
    AddBookCard(onClick = onAddBookClick)
}

@Composable
private fun MyBookRowCard(myBook: MyBook, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Pale)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        MyBookCover(myBook)
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text(myBook.title, color = Ink, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(myBook.author.ifBlank { "저자 정보 없음" }, color = Color(0xFF666666), fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            if (myBook.publisher.isNotBlank()) {
                Text(myBook.publisher, color = Color(0xFF777777), fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        Text("${myBook.totalPage}p", color = Olive, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun MyBookCover(myBook: MyBook) {
    val modifier = Modifier.size(width = 58.dp, height = 76.dp)
    myBook.coverImageRes?.let { imageRes ->
        Image(
            painter = painterResource(imageRes),
            contentDescription = myBook.title,
            contentScale = ContentScale.Crop,
            modifier = modifier.clip(RoundedCornerShape(8.dp))
        )
        return
    }

    if (!myBook.bookImageUrl.isNullOrBlank() || !myBook.coverImageUri.isNullOrBlank()) {
        BookCoverImage(
            localUri = myBook.coverImageUri,
            imageUrl = myBook.bookImageUrl,
            title = myBook.title,
            modifier = modifier
        )
        return
    }

    var imageBitmap by remember(myBook.myBookId) { mutableStateOf<ImageBitmap?>(null) }
    var loading by remember(myBook.myBookId) { mutableStateOf(true) }
    LaunchedEffect(myBook.title, myBook.author) {
        loading = true
        imageBitmap = loadGoogleBooksCoverBitmap(myBook.title, myBook.author)
        loading = false
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Pale),
        contentAlignment = Alignment.Center
    ) {
        val bitmap = imageBitmap
        if (bitmap != null) {
            Image(
                bitmap = bitmap,
                contentDescription = myBook.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else if (loading) {
            CircularProgressIndicator(color = Olive, modifier = Modifier.size(22.dp))
        } else {
            Text("책", color = Olive, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun AddBookCard(onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Color.White)
            .clickable(onClick = onClick)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(width = 58.dp, height = 76.dp)
                .clip(RoundedCornerShape(6.dp))
                .background(Pale),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Outlined.Add, contentDescription = null, tint = Olive)
        }
        Spacer(Modifier.width(12.dp))
        Column(Modifier.weight(1f)) {
            Text("새 책 등록", color = Ink, fontWeight = FontWeight.Bold)
            Text("책 사진으로 정보를 불러오거나 직접 입력하세요.", color = Color(0xFF666666), fontSize = 12.sp)
        }
        Text("추가", color = Olive, fontWeight = FontWeight.Bold, fontSize = 12.sp)
    }
}

@Composable
private fun ReadingProgressSection(currentPage: Int, totalPage: Int, progress: Float) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Pale)
            .padding(14.dp)
    ) {
        Text("독서 진행률", color = Ink, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(10.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            LinearProgressIndicator(
                progress = { progress },
                color = Olive,
                trackColor = Color(0xFFE0F2FE),
                modifier = Modifier
                    .weight(1f)
                    .height(8.dp)
                    .clip(RoundedCornerShape(8.dp))
            )
            Text(
                "${(progress * 100).toInt()}%",
                color = Olive,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(start = 10.dp)
            )
        }
        Spacer(Modifier.height(8.dp))
        Text("현재 페이지 $currentPage / ${totalPage}p", color = Color(0xFF555555), fontSize = 13.sp)
    }
}

@Composable
private fun PageRecordSection(
    totalPageText: String,
    directPageText: String,
    onMinusClick: () -> Unit,
    onPlusClick: () -> Unit,
    onTotalPageChange: (String) -> Unit,
    onDirectPageChange: (String) -> Unit,
    onSaveClick: () -> Unit
) {
    Column(Modifier.fillMaxWidth()) {
        SectionLabel("현재 페이지 기록")
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(onClick = onMinusClick, colors = mutedButtonColors(), shape = RoundedCornerShape(8.dp), modifier = Modifier.size(44.dp)) {
                Text("-")
            }
            OutlinedTextField(
                value = directPageText,
                onValueChange = onDirectPageChange,
                singleLine = true,
                textStyle = androidx.compose.ui.text.TextStyle(textAlign = TextAlign.Center, fontWeight = FontWeight.Bold),
                modifier = Modifier.weight(1f)
            )
            Text("/", color = Color(0xFF999999))
            OutlinedTextField(
                value = totalPageText,
                onValueChange = onTotalPageChange,
                singleLine = true,
                suffix = { Text("p") },
                modifier = Modifier.weight(1f)
            )
            Button(onClick = onPlusClick, colors = mutedButtonColors(), shape = RoundedCornerShape(8.dp), modifier = Modifier.size(44.dp)) {
                Text("+")
            }
        }
        Spacer(Modifier.height(8.dp))
        Button(onClick = onSaveClick, modifier = Modifier.fillMaxWidth(), colors = mutedButtonColors(), shape = RoundedCornerShape(8.dp)) {
            Text("페이지 저장")
        }
    }
}

@Composable
private fun TextRecordSection(
    title: String,
    value: String,
    placeholder: String,
    onValueChange: (String) -> Unit,
    onSaveClick: () -> Unit
) {
    Column(Modifier.fillMaxWidth()) {
        SectionLabel(title)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder) },
            minLines = 4,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))
        Button(onClick = onSaveClick, colors = primaryButtonColors(), shape = RoundedCornerShape(8.dp), modifier = Modifier.fillMaxWidth()) {
            Text("저장")
        }
    }
}

@Composable
fun JoinedMeetingDetailScreen(
    meeting: Meeting?,
    onBackClick: () -> Unit,
    onEnterChatClick: (String) -> Unit
) {
    DetailScaffold(title = "참여 모임 상세", onBackClick = onBackClick) {
        if (meeting == null) {
            CircularProgressIndicator(color = Olive)
            return@DetailScaffold
        }
        MeetingDetail(meeting)
        Button(
            onClick = { onEnterChatClick(meeting.chatRoomId) },
            modifier = Modifier.fillMaxWidth(),
            colors = primaryButtonColors(),
            shape = RoundedCornerShape(8.dp)
        ) { Text("채팅방 입장하기") }
    }
}

@Composable
fun AiGuideScreen(guide: AIGuide, onBackClick: () -> Unit, onAiChatClick: () -> Unit) {
    DetailScaffold(title = "AI 독서 가이드", onBackClick = onBackClick) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(painter = painterResource(guide.imageRes), contentDescription = guide.title, contentScale = ContentScale.Crop, modifier = Modifier.size(82.dp).clip(RoundedCornerShape(8.dp)))
            Spacer(Modifier.width(12.dp))
            Column {
                Text(guide.title, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Ink)
                Text(guide.author, color = Color(0xFF777777))
                Text("매칭 ${guide.matchRate}%", color = Olive, fontWeight = FontWeight.Bold)
            }
        }
        InfoBox(guide.reason)
        GuideList("배경지식", guide.backgroundKnowledge)
        GuideList("키워드", guide.keywords)
        GuideList("질문", guide.bookQuestions)
        GuideList("토론 주제", guide.discussionTopics)
        GuideList("AI 프롬프트", guide.aiPrompts)
        Button(
            onClick = onAiChatClick,
            modifier = Modifier.fillMaxWidth(),
            colors = primaryButtonColors(),
            shape = RoundedCornerShape(8.dp)
        ) { Text("AI 챗봇") }
    }
}

@Composable
fun AiChatScreen(
    guide: AIGuide,
    geminiChatModule: GeminiChatModule,
    onBackClick: () -> Unit
) {
    val messages = remember(guide.id) {
        mutableStateListOf(
            AiChatMessage(
                text = "'${guide.title}'에 대해 궁금한 점을 물어보세요.",
                isUser = false
            )
        )
    }
    var input by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Scaffold(containerColor = Color.White) { padding ->
        Column(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            TopBar("AI 챗봇", onBackClick)
            Text("${guide.title} · ${guide.author}", color = Olive, fontWeight = FontWeight.Bold)
            if (!error.isNullOrBlank()) InfoBox(error.orEmpty())
            LazyColumn(
                Modifier.weight(1f).padding(vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(messages) { message -> AiMessageBubble(message) }
                if (loading) {
                    item {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Start) {
                            CircularProgressIndicator(color = Olive, modifier = Modifier.size(24.dp))
                        }
                    }
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = input,
                    onValueChange = { input = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("질문을 입력하세요") },
                    enabled = !loading
                )
                Spacer(Modifier.width(8.dp))
                Button(
                    enabled = input.isNotBlank() && !loading,
                    onClick = {
                        val question = input.trim()
                        input = ""
                        error = null
                        loading = true
                        messages.add(AiChatMessage(question, isUser = true))
                        scope.launch {
                            runCatching { geminiChatModule.sendMessage(guide, question) }
                                .onSuccess { answer -> messages.add(AiChatMessage(answer, isUser = false)) }
                                .onFailure { throwable -> error = throwable.message ?: "Gemini 응답 실패" }
                            loading = false
                        }
                    },
                    colors = primaryButtonColors(),
                    shape = RoundedCornerShape(8.dp)
                ) { Text("전송") }
            }
        }
    }
}

@Composable
private fun MeetingCard(meeting: Meeting, onClick: (Meeting) -> Unit) {
    Column(
        modifier = Modifier.width(230.dp).clip(RoundedCornerShape(8.dp)).background(Pale).clickable { onClick(meeting) }.padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Text(meeting.title, fontWeight = FontWeight.Bold, color = Ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(meeting.bookTitle.ifBlank { "책 정보 입력 대기" }, color = Olive, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text("${meeting.place} · ${meeting.meetingDate} ${meeting.meetingTime}", color = Color(0xFF666666), fontSize = 12.sp, maxLines = 2)
        if (meeting.placeLatitude != null && meeting.placeLongitude != null) {
            KakaoMapPreview(
                placeName = meeting.place,
                address = meeting.placeAddress,
                latitude = meeting.placeLatitude,
                longitude = meeting.placeLongitude,
                modifier = Modifier.fillMaxWidth().height(92.dp)
            )
        }
        Text("${meeting.currentParticipantsCount}/${meeting.maxParticipants}명", color = Color(0xFF555555), fontSize = 12.sp)
    }
}

@Composable
private fun MeetingListRow(meeting: Meeting, onClick: (Meeting) -> Unit) {
    Row(Modifier.fillMaxWidth().clickable { onClick(meeting) }.padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(48.dp).clip(RoundedCornerShape(8.dp)).background(Pale), contentAlignment = Alignment.Center) {
            Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = null, tint = Olive)
        }
        Spacer(Modifier.width(10.dp))
        Column(Modifier.weight(1f)) {
            Text(meeting.title, fontWeight = FontWeight.Bold, color = Ink)
            Text("${meeting.bookTitle} · ${meeting.place}", color = Color(0xFF666666), fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
    HorizontalDivider(color = Color(0xFFE0F2FE))
}

@Composable
private fun AiBookCard(guide: AIGuide, onClick: (AIGuide) -> Unit) {
    Column(Modifier.width(132.dp).clickable { onClick(guide) }) {
        Image(painter = painterResource(guide.imageRes), contentDescription = guide.title, contentScale = ContentScale.Crop, modifier = Modifier.size(width = 132.dp, height = 176.dp).clip(RoundedCornerShape(8.dp)))
        Spacer(Modifier.height(8.dp))
        Text(guide.title, fontWeight = FontWeight.Bold, color = Ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Text(guide.author, color = Color(0xFF777777), fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun OcrCandidateChip(text: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Pale)
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text, color = Ink, fontSize = 14.sp, modifier = Modifier.weight(1f))
        Text("선택", color = Olive, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun CandidateCard(candidate: BookInfo, onClick: () -> Unit) {
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(Pale).clickable(onClick = onClick).padding(12.dp)) {
        Text(candidate.bookTitle, fontWeight = FontWeight.Bold, color = Ink)
        Text(candidate.bookAuthor, color = Color(0xFF666666), fontSize = 12.sp)
        Text(candidate.bookDescription.orEmpty(), color = Color(0xFF777777), fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun KakaoPlaceCard(place: KakaoPlace, onClick: () -> Unit) {
    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(Pale).clickable(onClick = onClick).padding(12.dp)) {
        Text(place.name, fontWeight = FontWeight.Bold, color = Ink)
        Text(place.address.ifBlank { "주소 정보 없음" }, color = Color(0xFF666666), fontSize = 12.sp)
        if (place.phone.isNotBlank()) Text(place.phone, color = Color(0xFF777777), fontSize = 12.sp)
    }
}

@Composable
private fun KakaoMapPreview(
    placeName: String,
    address: String,
    latitude: Double,
    longitude: Double,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val mapUrl = remember(placeName, latitude, longitude) {
        kakaoMapLinkUrl(placeName.ifBlank { "선택한 장소" }, latitude, longitude)
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFFE0F2FE))
            .clickable {
                runCatching {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(mapUrl)))
                }
            }
            .padding(14.dp)
    ) {
        Column(
            modifier = Modifier.align(Alignment.CenterStart)
        ) {
            Text(
                "지도 보기",
                color = Olive,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(Modifier.height(6.dp))
            Text(
                placeName.ifBlank { "선택한 장소" },
                color = Ink,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                address.ifBlank { "위도 %.5f, 경도 %.5f".format(latitude, longitude) },
                color = Color(0xFF666666),
                fontSize = 12.sp,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
        }
        Text(
            "열기",
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .background(Color.White.copy(alpha = 0.92f), RoundedCornerShape(8.dp))
                .padding(horizontal = 10.dp, vertical = 6.dp),
            color = Olive,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

private fun kakaoMapLinkUrl(placeName: String, latitude: Double, longitude: Double): String {
    val encodedName = URLEncoder.encode(placeName, "UTF-8")
    return "https://map.kakao.com/link/map/$encodedName,$latitude,$longitude"
}

@Composable
private fun MeetingDetail(meeting: Meeting) {
    MeetingBookCover(meeting)
    SectionLabel(meeting.title.ifBlank { meeting.bookTitle.ifBlank { "모임 상세" } })
    InfoBox(meeting.description.ifBlank { "모임 설명이 없습니다." })
    InfoBox("책: ${meeting.bookTitle}\n저자: ${meeting.bookAuthor}\n개설자: ${meeting.hostName}\n장소: ${meeting.place}\n주소: ${meeting.placeAddress.ifBlank { "주소 정보 없음" }}\n일시: ${meeting.meetingDate} ${meeting.meetingTime}\n참가비: ${meeting.fee}원\n인원: ${meeting.currentParticipantsCount}/${meeting.maxParticipants}")
    if (meeting.placeLatitude != null && meeting.placeLongitude != null) {
        KakaoMapPreview(
            placeName = meeting.place,
            address = meeting.placeAddress,
            latitude = meeting.placeLatitude,
            longitude = meeting.placeLongitude,
            modifier = Modifier.fillMaxWidth().height(180.dp)
        )
    }
    if (!meeting.bookDescription.isNullOrBlank()) InfoBox(meeting.bookDescription)
}

@Composable
private fun MeetingBookCover(meeting: Meeting) {
    BookCoverImage(
        localUri = meeting.bookImageLocalUri,
        imageUrl = meeting.bookImageUrl,
        title = meeting.bookTitle,
        modifier = Modifier
            .fillMaxWidth()
            .height(240.dp)
    )
}

@Composable
private fun BookCoverImage(
    localUri: String?,
    imageUrl: String?,
    title: String,
    modifier: Modifier = Modifier
) {
    val readableLocalUri = localUri
        ?.takeIf { it.startsWith("content://") || it.startsWith("file://") }
    val remoteUrl = imageUrl?.takeIf { it.isNotBlank() }

    if (readableLocalUri == null && remoteUrl == null) {
        Box(
            modifier = modifier
                .clip(RoundedCornerShape(8.dp))
                .background(Pale),
            contentAlignment = Alignment.Center
        ) {
            Text("책", color = Olive, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        }
        return
    }

    val context = LocalContext.current
    val imageKey = readableLocalUri ?: remoteUrl.orEmpty()
    var imageBitmap by remember(imageKey) { mutableStateOf<ImageBitmap?>(null) }

    LaunchedEffect(imageKey) {
        imageBitmap = loadBookCoverBitmap(context, readableLocalUri, remoteUrl)
    }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(8.dp))
            .background(Pale),
        contentAlignment = Alignment.Center
    ) {
        val bitmap = imageBitmap
        if (bitmap != null) {
            Image(
                bitmap = bitmap,
                contentDescription = title,
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxSize().padding(10.dp)
            )
        } else {
            CircularProgressIndicator(color = Olive)
        }
    }
}

private suspend fun loadBookCoverBitmap(
    context: Context,
    localUri: String?,
    imageUrl: String?
): ImageBitmap? = withContext(Dispatchers.IO) {
    runCatching {
        val bitmap = if (!localUri.isNullOrBlank()) {
            context.contentResolver.openInputStream(Uri.parse(localUri))?.use(BitmapFactory::decodeStream)
        } else {
            val remoteUrl = imageUrl ?: return@runCatching null
            val coverFile = downloadBookCoverOnce(context, remoteUrl) ?: return@runCatching null
            BitmapFactory.decodeFile(coverFile.absolutePath)
        }
        bitmap?.asImageBitmap()
    }.getOrNull()
}

private suspend fun loadGoogleBooksCoverBitmap(title: String, author: String): ImageBitmap? = withContext(Dispatchers.IO) {
    runCatching {
        val query = listOf(title, author).filter { it.isNotBlank() }.joinToString(" ")
        val encoded = URLEncoder.encode(query, "UTF-8")
        val searchUrl = "https://www.googleapis.com/books/v1/volumes?q=$encoded&maxResults=5"
        val json = URL(searchUrl).openStream().bufferedReader(Charsets.UTF_8).use { it.readText() }
        val items = JSONObject(json).optJSONArray("items") ?: return@runCatching null
        var thumbnail: String? = null
        for (index in 0 until items.length()) {
            val imageLinks = items.optJSONObject(index)
                ?.optJSONObject("volumeInfo")
                ?.optJSONObject("imageLinks")
            thumbnail = imageLinks
                ?.optString("thumbnail")
                ?.ifBlank { imageLinks.optString("smallThumbnail") }
                ?.replace("http://", "https://")
                ?.takeIf { it.isNotBlank() }
            if (thumbnail != null) break
        }
        thumbnail ?: return@runCatching null

        URL(thumbnail).openStream().use(BitmapFactory::decodeStream)?.asImageBitmap()
    }.getOrNull()
}

private suspend fun downloadBookCoverOnce(context: Context, imageUrl: String): File? {
    val fileName = "book_cover_${imageUrl.sha256()}.jpg"
    val coverDir = context.getExternalFilesDir(Environment.DIRECTORY_PICTURES) ?: return null
    val coverFile = File(coverDir, fileName)
    if (coverFile.exists() && coverFile.length() > 0L) return coverFile

    val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    val prefs = context.getSharedPreferences(BookCoverDownloadPrefs, Context.MODE_PRIVATE)
    val prefKey = "download_$fileName"
    var downloadId = prefs.getLong(prefKey, -1L)

    if (downloadId > 0L) {
        when (manager.downloadStatus(downloadId)) {
            DownloadManager.STATUS_SUCCESSFUL -> {
                if (coverFile.exists() && coverFile.length() > 0L) return coverFile
                prefs.edit().remove(prefKey).apply()
                downloadId = -1L
            }
            DownloadManager.STATUS_FAILED, null -> {
                prefs.edit().remove(prefKey).apply()
                downloadId = -1L
            }
        }
    }

    if (downloadId <= 0L) {
        downloadId = manager.enqueue(
            DownloadManager.Request(Uri.parse(imageUrl))
                .setTitle(fileName)
                .setDescription("Downloading book cover")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationUri(Uri.fromFile(coverFile))
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true)
        )
        prefs.edit().putLong(prefKey, downloadId).apply()
    }

    repeat(60) {
        when (manager.downloadStatus(downloadId)) {
            DownloadManager.STATUS_SUCCESSFUL -> {
                if (coverFile.exists() && coverFile.length() > 0L) return coverFile
            }
            DownloadManager.STATUS_FAILED -> {
                prefs.edit().remove(prefKey).apply()
                return null
            }
        }
        delay(500)
    }
    return null
}

private fun DownloadManager.downloadStatus(downloadId: Long): Int? =
    query(DownloadManager.Query().setFilterById(downloadId))?.use { cursor ->
        if (!cursor.moveToFirst()) {
            null
        } else {
            cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
        }
    }

private fun String.sha256(): String {
    val digest = MessageDigest.getInstance("SHA-256").digest(toByteArray(Charsets.UTF_8))
    return digest.joinToString("") { "%02x".format(it) }
}

@Composable
private fun MessageBubble(message: MeetingMessage, isMine: Boolean) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start) {
        Column(Modifier.clip(RoundedCornerShape(8.dp)).background(if (isMine) Olive else Pale).padding(10.dp)) {
            if (!isMine) Text(message.senderName, color = Olive, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(message.text, color = if (isMine) Color.White else Ink)
        }
    }
}

@Composable
private fun AiMessageBubble(message: AiChatMessage) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = if (message.isUser) Arrangement.End else Arrangement.Start) {
        Column(
            Modifier
                .fillMaxWidth(0.82f)
                .clip(RoundedCornerShape(8.dp))
                .background(if (message.isUser) Olive else Pale)
                .padding(10.dp)
        ) {
            Text(if (message.isUser) "나" else "AI 챗봇", color = if (message.isUser) Color.White else Olive, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(message.text, color = if (message.isUser) Color.White else Ink)
        }
    }
}

@Composable
private fun DetailScaffold(title: String, onBackClick: () -> Unit, content: @Composable () -> Unit) {
    LazyColumn(Modifier.fillMaxSize().background(Color.White).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { TopBar(title, onBackClick) }
        item {
            Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                content()
            }
        }
    }
}

@Composable
private fun TopBar(title: String, onBackClick: () -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onBackClick) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "뒤로가기", tint = Ink) }
        Text(title, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Ink)
    }
}

@Composable
private fun Header(title: String, subtitle: String) {
    Column {
        Text(title, fontWeight = FontWeight.Bold, fontSize = 26.sp, color = Olive)
        Text(subtitle, color = Color(0xFF777777), fontSize = 14.sp)
    }
}

@Composable
private fun SectionHeader(title: String, actionText: String?, onActionClick: () -> Unit) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(title, fontWeight = FontWeight.Bold, color = Ink, fontSize = 17.sp, modifier = Modifier.weight(1f))
        if (actionText != null) {
            Button(onClick = onActionClick, colors = mutedButtonColors(), shape = RoundedCornerShape(8.dp)) {
                Icon(Icons.Outlined.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(4.dp))
                Text(actionText)
            }
        }
    }
}

@Composable
private fun BottomBar(onHomeClick: () -> Unit, onMyPageClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().background(Color.White).padding(12.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
        IconButton(onClick = onHomeClick) { Icon(Icons.Outlined.Home, contentDescription = "홈", tint = Olive) }
        IconButton(onClick = onMyPageClick) { Icon(Icons.Outlined.Person, contentDescription = "마이페이지", tint = Color(0xFF777777)) }
    }
}

@Composable
private fun SectionLabel(text: String) { Text(text, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Ink) }

@Composable
private fun PickerField(label: String, value: String, onClick: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(label, color = Color(0xFF555555), fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(6.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(Pale)
                .clickable(onClick = onClick)
                .padding(horizontal = 12.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(value, color = Ink, fontSize = 15.sp, modifier = Modifier.weight(1f))
            Text("선택", color = Olive, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun InputField(label: String, value: String, onChange: (String) -> Unit) {
    OutlinedTextField(value = value, onValueChange = onChange, label = { Text(label) }, modifier = Modifier.fillMaxWidth(), singleLine = false)
}

@Composable
private fun InfoBox(text: String) {
    Text(text, modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(Pale).padding(12.dp), color = Color(0xFF555555), fontSize = 13.sp)
}

@Composable
private fun EmptyBox(text: String) {
    Box(Modifier.fillMaxWidth().height(96.dp).clip(RoundedCornerShape(8.dp)).background(Pale), contentAlignment = Alignment.Center) {
        Text(text, color = Color(0xFF777777), fontSize = 13.sp)
    }
}

@Composable
private fun GuideList(title: String, items: List<String>) {
    SectionLabel(title)
    items.forEach { InfoBox(it) }
}

@Composable
private fun primaryButtonColors() = ButtonDefaults.buttonColors(containerColor = Olive, contentColor = Color.White)

@Composable
private fun mutedButtonColors() = ButtonDefaults.buttonColors(containerColor = Pale, contentColor = Color(0xFF555555))
