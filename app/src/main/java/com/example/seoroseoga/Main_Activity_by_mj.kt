package com.example.seoroseoga

import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.Lightbulb
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.QuestionAnswer
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// 서로서가의 두 기저 데이터객체의 양대산맥은 이 둘
//- AI 쪽은 Book 클래스 위주(대여 관련 정보 필요 x 니까)
//- 대여 쪽은 Book 내용을 그대로 포함하면서(Book 의 모든 내용을 다 가지면서 추가적인 내용을 가짐)
//- 대여자, 장소, 대여료 같은 우리 서비스 전용 정보를 덧붙인 RentalBook 사용

data class Book(
    val id: String,
    val title: String,
    val author: String,
    val imageRes: Int,
    val rank: Int? = null,
    val status: String = "대여 가능"
)

data class RentalBook(
    val rentalId: String,
    val book: Book,
    val rank: Int? = null,
    val rentalStatus: String = "대여 가능",
    val rentalFee: String = "1,500원 / 1주",
    val condition: String = "좋음",
    val owner: String = "정다은",
    val location: String = "부산대학교 인문관",
    val rating: Float = 4.6f,
    val reviewCount: Int = 23
)

data class AIGuide(
    val book: Book,
    val matchRate: Int,
    val reason: String,
    val tags: List<String>,
    val readingTime: String,
    val backgroundKnowledge: List<String>,
    val keywords: List<String>,
    val bookQuestions: List<String>,
    val discussionTopics: List<String>,
    val aiPrompts: List<String>
)

data class BorrowedBook(
    val borrowedId: String,
    val rentalBook: RentalBook,
    val borrowedAtMillis: Long
)

data class MyBook(
    val myBookId: String,
    val title: String,
    val author: String,
    val publisher: String = "",
    val coverImageUri: String? = null,
    val addedAtMillis: Long
)

data class ChatRoom(
    val chatRoomId: String,
    val rentalId: String,
    val status: ChatRoomStatus = ChatRoomStatus.REQUESTING
)

enum class ChatRoomStatus {
    REQUESTING,
    AGREEMENT_COMPLETED
}

data class ChatMessage(
    val messageId: String,
    val chatRoomId: String,
    val senderType: SenderType,
    val text: String,
    val createdAtMillis: Long
)

enum class SenderType {
    ME,
    OWNER
}

enum class ReadingBookSource {
    BORROWED,
    MY_BOOK
}

data class ReadingLog(
    val readingLogId: String,
    val source: ReadingBookSource,
    val bookId: String,
    val title: String,
    val author: String,
    val coverImageUri: String? = null,
    val coverImageRes: Int? = null,
    val currentPage: Int = 0,
    val totalPage: Int = 300,
    val quote: String = "",
    val review: String = "",
    val updatedAtMillis: Long
)

data class ReadingComment(
    val commenterName: String,
    val text: String,
    val likeCount: Int
)

enum class MyPageTab {
    BORROWED,
    MY_BOOKS
}

enum class BottomNavDestination {
    HOME,
    SEARCH,
    MY_PAGE
}

sealed interface AppScreen {
    data object Home : AppScreen
    data object AiRecommendations : AppScreen
    data class AiGuide(val guide: AIGuide) : AppScreen
    data class RentalDetail(val rentalId: String) : AppScreen
    data class Chat(val chatRoomId: String) : AppScreen
    data class MyPage(val initialTab: MyPageTab = MyPageTab.BORROWED) : AppScreen
    data object AddBook : AppScreen
    data class ReadingLog(val source: ReadingBookSource, val bookId: String) : AppScreen
    data object SearchPlaceholder : AppScreen
    data object AddRentalBookPlaceholder : AppScreen
}

class MainActivityByMj : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SeoroSeogaPrototypeApp()
        }
    }
}

@Composable
fun SeoroSeogaPrototypeApp() {
    MaterialTheme {
        val aiGuides = remember { sampleAiGuides() }
        val rentalBooks = remember { mutableStateListOf(*sampleRentalBooks().toTypedArray()) }
        val borrowedBooks = remember {
            mutableStateListOf(
                BorrowedBook(
                    borrowedId = "borrowed-initial-1",
                    rentalBook = rentalBooks[0],
                    borrowedAtMillis = System.currentTimeMillis()
                )
            )
        }
        val myBooks = remember { mutableStateListOf(*sampleMyBooks().toTypedArray()) }
        val chatRooms = remember { mutableStateListOf<ChatRoom>() }
        val chatMessages = remember { mutableStateListOf<ChatMessage>() }
        val readingLogs = remember { mutableStateListOf<ReadingLog>() }
        val comments = remember { sampleReadingComments() }

        var screen by remember { mutableStateOf<AppScreen>(AppScreen.Home) }

        fun getRentalBookById(rentalId: String): RentalBook? =
            rentalBooks.firstOrNull { it.rentalId == rentalId }

        fun getOrCreateChatRoom(rentalId: String): ChatRoom {
            val existing = chatRooms.firstOrNull { it.rentalId == rentalId }
            if (existing != null) return existing

            val created = ChatRoom(
                chatRoomId = "chat-${rentalId}-${chatRooms.size + 1}",
                rentalId = rentalId
            )
            chatRooms.add(created)
            chatMessages.add(
                ChatMessage(
                    messageId = "msg-${created.chatRoomId}-1",
                    chatRoomId = created.chatRoomId,
                    senderType = SenderType.OWNER,
                    text = "안녕하세요. 책 상태 좋고 바로 대여 가능합니다.",
                    createdAtMillis = System.currentTimeMillis()
                )
            )
            return created
        }

        fun getMessages(chatRoomId: String): List<ChatMessage> =
            chatMessages.filter { it.chatRoomId == chatRoomId }.sortedBy { it.createdAtMillis }

        fun sendMessage(chatRoomId: String, text: String): ChatMessage {
            val message = ChatMessage(
                messageId = "msg-${chatRoomId}-${chatMessages.size + 1}",
                chatRoomId = chatRoomId,
                senderType = SenderType.ME,
                text = text,
                createdAtMillis = System.currentTimeMillis()
            )
            chatMessages.add(message)
            return message
        }

        fun completeAgreement(chatRoomId: String) {
            val roomIndex = chatRooms.indexOfFirst { it.chatRoomId == chatRoomId }
            if (roomIndex >= 0) {
                val room = chatRooms[roomIndex]
                chatRooms[roomIndex] = room.copy(status = ChatRoomStatus.AGREEMENT_COMPLETED)
                val rentalBook = getRentalBookById(room.rentalId)
                if (rentalBook != null && borrowedBooks.none { it.rentalBook.rentalId == rentalBook.rentalId }) {
                    borrowedBooks.add(
                        BorrowedBook(
                            borrowedId = "borrowed-${borrowedBooks.size + 1}",
                            rentalBook = rentalBook,
                            borrowedAtMillis = System.currentTimeMillis()
                        )
                    )
                }
            }
        }

        fun addMyBook( // 마이페이지에서 내가 읽고 있는 책 추가
            title: String,
            author: String,
            publisher: String,
            coverImageUri: String?
        ): MyBook {
            val book = MyBook(
                myBookId = "my-book-${myBooks.size + 1}",
                title = title,
                author = author,
                publisher = publisher,
                coverImageUri = coverImageUri,
                addedAtMillis = System.currentTimeMillis()
            )
            myBooks.add(0, book)
            return book
        }

        fun getOrCreateReadingLog(
            source: ReadingBookSource,
            bookId: String,
            title: String,
            author: String,
            coverImageUri: String?,
            coverImageRes: Int?
        ): ReadingLog {
            val existing = readingLogs.firstOrNull { it.source == source && it.bookId == bookId }
            if (existing != null) return existing

            val created = ReadingLog(
                readingLogId = "reading-log-${readingLogs.size + 1}",
                source = source,
                bookId = bookId,
                title = title,
                author = author,
                coverImageUri = coverImageUri,
                coverImageRes = coverImageRes,
                updatedAtMillis = System.currentTimeMillis()
            )
            readingLogs.add(created)
            return created
        }

        fun updateReadingLog(
            source: ReadingBookSource,
            bookId: String,
            transform: (ReadingLog) -> ReadingLog
        ): ReadingLog? {
            val index = readingLogs.indexOfFirst { it.source == source && it.bookId == bookId }
            if (index < 0) return null
            val updated = transform(readingLogs[index]).copy(updatedAtMillis = System.currentTimeMillis())
            readingLogs[index] = updated
            return updated
        }

        // 어떤 화면에서 어떤 버튼이 눌렸을때 어떤 동작을 하게 할지에 대한 navigation
        when (val currentScreen = screen) {
            // 홈 화면에서 어떤 버튼이 눌렸을때 어떤 동작을 하게 할지에 대한 navigation
            AppScreen.Home -> HomeScreen(
                rentalBooks = rentalBooks,
                aiGuides = aiGuides,
                onRentalMoreClick = { screen = AppScreen.SearchPlaceholder },
                onBookRegisterClick = { screen = AppScreen.AddRentalBookPlaceholder },
                onRentalBookClick = { rentalBook ->
                    screen = AppScreen.RentalDetail(rentalBook.rentalId)
                },
                onAiMoreClick = { screen = AppScreen.AiRecommendations },
                onAiBookClick = { guide -> screen = AppScreen.AiGuide(guide) },
                onHomeClick = { screen = AppScreen.Home },
                onSearchClick = { screen = AppScreen.SearchPlaceholder },
                onMyPageClick = { screen = AppScreen.MyPage() }
            )

            // 홈 화면에서 ai 추천 도서 배너 옆의 더보기를 누르고 들어갔을때 나오는 화면에서
            // 어떤 버튼이 눌렸을때 어떤 동작을 하게 할지에 대한 navigation
            AppScreen.AiRecommendations -> AiRecommendationScreen(
                guides = aiGuides,
                onBackClick = { screen = AppScreen.Home },
                onGuideClick = { guide -> screen = AppScreen.AiGuide(guide) },
                onHomeClick = { screen = AppScreen.Home },
                onSearchClick = { screen = AppScreen.SearchPlaceholder },
                onMyPageClick = { screen = AppScreen.MyPage() }
            )

            // 홈 화면에서 ai 추천 도서 배너 밑의 책 버튼를 누르고 들어갔을때 나오는 화면에서
            // 어떤 버튼이 눌렸을때 어떤 동작을 하게 할지에 대한 navigation
            is AppScreen.AiGuide -> AIGuideScreen(
                guide = currentScreen.guide,
                onBackClick = { screen = AppScreen.Home }
            )

            is AppScreen.RentalDetail -> RentalDetailScreen(
                rentalBook = getRentalBookById(currentScreen.rentalId),
                onBackClick = { screen = AppScreen.Home },
                onRequestRentalClick = { rentalBook ->
                    val room = getOrCreateChatRoom(rentalBook.rentalId)
                    screen = AppScreen.Chat(room.chatRoomId)
                }
            )

            is AppScreen.Chat -> {
                val room = chatRooms.firstOrNull { it.chatRoomId == currentScreen.chatRoomId }
                val rentalBook = room?.let { getRentalBookById(it.rentalId) }

                ChatScreen(
                    rentalBook = rentalBook,
                    initialMessages = getMessages(currentScreen.chatRoomId),
                    onBackClick = {
                        if (room != null) {
                            screen = AppScreen.RentalDetail(room.rentalId)
                        } else {
                            screen = AppScreen.Home
                        }
                    },
                    onSendMessage = { message ->
                        sendMessage(currentScreen.chatRoomId, message)
                    },
                    onCompleteAgreement = {
                        completeAgreement(currentScreen.chatRoomId)
                    }
                )
            }

            is AppScreen.MyPage -> MyPageScreen(
                borrowedBooks = borrowedBooks,
                myBooks = myBooks,
                initialTab = currentScreen.initialTab,
                onAddBookClick = { screen = AppScreen.AddBook },
                onBorrowedBookClick = { borrowedBook ->
                    screen = AppScreen.ReadingLog(
                        source = ReadingBookSource.BORROWED,
                        bookId = borrowedBook.borrowedId
                    )
                },
                onMyBookClick = { myBook ->
                    screen = AppScreen.ReadingLog(
                        source = ReadingBookSource.MY_BOOK,
                        bookId = myBook.myBookId
                    )
                },
                onHomeClick = { screen = AppScreen.Home },
                onSearchClick = { screen = AppScreen.SearchPlaceholder },
                onMyPageClick = { screen = AppScreen.MyPage(currentScreen.initialTab) }
            )

            AppScreen.AddBook -> AddBookScreen(
                onBackClick = { screen = AppScreen.MyPage(MyPageTab.MY_BOOKS) },
                onSaveClick = { title, author, publisher, coverImageUri ->
                    addMyBook(
                        title = title,
                        author = author,
                        publisher = publisher,
                        coverImageUri = coverImageUri
                    )
                    screen = AppScreen.MyPage(MyPageTab.MY_BOOKS)
                }
            )

            is AppScreen.ReadingLog -> {
                val readingLog = when (currentScreen.source) {
                    ReadingBookSource.BORROWED -> {
                        val borrowedBook = borrowedBooks.firstOrNull { it.borrowedId == currentScreen.bookId }
                        borrowedBook?.let {
                            getOrCreateReadingLog(
                                source = ReadingBookSource.BORROWED,
                                bookId = it.borrowedId,
                                title = it.rentalBook.book.title,
                                author = it.rentalBook.book.author,
                                coverImageUri = null,
                                coverImageRes = it.rentalBook.book.imageRes
                            )
                        }
                    }

                    ReadingBookSource.MY_BOOK -> {
                        val myBook = myBooks.firstOrNull { it.myBookId == currentScreen.bookId }
                        myBook?.let {
                            getOrCreateReadingLog(
                                source = ReadingBookSource.MY_BOOK,
                                bookId = it.myBookId,
                                title = it.title,
                                author = it.author,
                                coverImageUri = it.coverImageUri,
                                coverImageRes = null
                            )
                        }
                    }
                }

                ReadingLogScreen(
                    readingLog = readingLog,
                    comments = comments,
                    onBackClick = {
                        val tab = if (currentScreen.source == ReadingBookSource.BORROWED) {
                            MyPageTab.BORROWED
                        } else {
                            MyPageTab.MY_BOOKS
                        }
                        screen = AppScreen.MyPage(tab)
                    },
                    onSavePage = { currentPage, totalPage ->
                        updateReadingLog(currentScreen.source, currentScreen.bookId) {
                            it.copy(
                                currentPage = currentPage,
                                totalPage = totalPage
                            )
                        }
                    },
                    onSaveQuote = { quote ->
                        updateReadingLog(currentScreen.source, currentScreen.bookId) {
                            it.copy(quote = quote)
                        }
                    },
                    onSaveReview = { review ->
                        updateReadingLog(currentScreen.source, currentScreen.bookId) {
                            it.copy(review = review)
                        }
                    }
                )
            }

            // 홈 화면에서 검색 들어갔을때 나오는 화면에서
            // 어떤 버튼이 눌렸을때 어떤 동작을 하게 할지에 대한 navigation
            AppScreen.SearchPlaceholder -> PlaceholderScreen(
                title = "검색",
                description = "검색 화면은 아직 프로토타입 범위에 포함되지 않았습니다.",
                onBackClick = { screen = AppScreen.Home }
            )

            // 홈 화면에서 대여 가능 책 배너 밑의 책 등록 버튼를 누르고 들어갔을때 나오는 화면
            // 즉 내가 남에게 빌려줄 책을 등록하는 화면 이후의 흐름
            // 어떤 버튼이 눌렸을때 어떤 동작을 하게 할지에 대한 navigation
            AppScreen.AddRentalBookPlaceholder -> PlaceholderScreen(
                title = "AddRentalBookScreen",
                description = "홈의 책 등록 버튼은 대여용 책 등록 화면으로 연결될 예정입니다. 이 흐름은 MyPage의 AddBookScreen과 별개입니다.",
                onBackClick = { screen = AppScreen.Home }
            )
        }
    }
}

//홈화면

@Composable
fun HomeScreen(
    rentalBooks: List<RentalBook>,
    aiGuides: List<AIGuide>,
    onRentalMoreClick: () -> Unit,
    onBookRegisterClick: () -> Unit,
    onRentalBookClick: (RentalBook) -> Unit,
    onAiMoreClick: () -> Unit,
    onAiBookClick: (AIGuide) -> Unit,
    onHomeClick: () -> Unit,
    onSearchClick: () -> Unit,
    onMyPageClick: () -> Unit
) {
    Scaffold(
        bottomBar = {
            BottomNavigationBar(
                selectedDestination = BottomNavDestination.HOME,
                onHomeClick = onHomeClick,
                onSearchClick = onSearchClick,
                onMyPageClick = onMyPageClick
            )
        },
        containerColor = Color.White
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp)
        ) {
            Spacer(modifier = Modifier.height(20.dp))

            TopHeader()

            Spacer(modifier = Modifier.height(16.dp))

            SearchBar(onClick = onSearchClick)

            Spacer(modifier = Modifier.height(24.dp))

            SectionHeader(
                title = "대여 가능 책",
                showRegisterButton = true,
                onMoreClick = onRentalMoreClick,
                onRegisterClick = onBookRegisterClick
            )

            Spacer(modifier = Modifier.height(12.dp))

            BookHorizontalList(
                books = rentalBooks.map {
                    it.book.copy(
                        id = it.rentalId,
                        rank = it.rank,
                        status = it.rentalStatus
                    )
                },
                onBookClick = { book ->
                    rentalBooks.firstOrNull { it.rentalId == book.id }?.let(onRentalBookClick)
                }
            )

            Spacer(modifier = Modifier.height(28.dp))

            SectionHeader(
                title = "AI 추천 도서",
                showRegisterButton = false,
                onMoreClick = onAiMoreClick
            )

            Spacer(modifier = Modifier.height(12.dp))

            BookHorizontalList(
                books = aiGuides.map { it.book },
                onBookClick = { book ->
                    aiGuides.firstOrNull { it.book.id == book.id }?.let(onAiBookClick)
                }
            )
        }
    }
}

@Composable
fun AiRecommendationScreen(
    guides: List<AIGuide>,
    onBackClick: () -> Unit,
    onGuideClick: (AIGuide) -> Unit,
    onHomeClick: () -> Unit,
    onSearchClick: () -> Unit,
    onMyPageClick: () -> Unit
) {
    Scaffold(
        topBar = {
            PageTopBar(
                title = "AI 추천 도서",
                onBackClick = onBackClick
            )
        },
        bottomBar = {
            BottomNavigationBar(
                selectedDestination = BottomNavDestination.HOME,
                onHomeClick = onHomeClick,
                onSearchClick = onSearchClick,
                onMyPageClick = onMyPageClick
            )
        },
        containerColor = Color.White
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 24.dp)
        ) {
            item {
                RecommendationSummary()
            }

            items(guides) { guide ->
                RecommendationListItem(
                    guide = guide,
                    onClick = { onGuideClick(guide) }
                )
            }
        }
    }
}

@Composable
fun AIGuideScreen(
    guide: AIGuide,
    onBackClick: () -> Unit
) {
    Scaffold(
        topBar = {
            PageTopBar(
                title = "AI 가이드",
                onBackClick = onBackClick
            )
        },
        containerColor = Color.White
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(top = 8.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                GuideHero(guide)
            }

            item {
                AiGuideIntro(reason = guide.reason)
            }

            item {
                GuideMenuRow(
                    title = "도서 정보 보기",
                    iconColor = Color(0xFF4C6FFF),
                    icon = {
                        Text(
                            text = "i",
                            color = Color.White,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    lines = listOf("도서 상세 정보 화면으로 연결될 예정입니다.")
                )
            }

            item {
                GuideMenuRow(
                    title = "읽기 전 배경지식",
                    iconColor = Color(0xFF8B6CE8),
                    icon = {
                        Icon(
                            imageVector = Icons.Outlined.Lightbulb,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(15.dp)
                        )
                    },
                    lines = guide.backgroundKnowledge
                )
            }

            item {
                GuideMenuRow(
                    title = "핵심 키워드",
                    iconColor = Color(0xFFFFB340),
                    icon = {
                        Text(
                            text = "#",
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    },
                    chips = guide.keywords
                )
            }

            item {
                GuideMenuRow(
                    title = "이 책이 던지는 질문",
                    iconColor = Color(0xFF5B8DEF),
                    icon = {
                        Icon(
                            imageVector = Icons.Outlined.QuestionAnswer,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(15.dp)
                        )
                    },
                    lines = guide.bookQuestions
                )
            }

            item {
                GuideMenuRow(
                    title = "토론 주제 생성",
                    iconColor = Color(0xFF52B788),
                    icon = {
                        Icon(
                            imageVector = Icons.Outlined.ChatBubbleOutline,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(15.dp)
                        )
                    },
                    lines = guide.discussionTopics
                )
            }

            item {
                Button(
                    onClick = { },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF2F64E5),
                        contentColor = Color.White
                    )
                ) {
                    Text(
                        text = "AI에게 질문하기",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
fun RentalDetailScreen(
    rentalBook: RentalBook?,
    onBackClick: () -> Unit,
    onRequestRentalClick: (RentalBook) -> Unit
) {
    if (rentalBook == null) {
        SimpleNotFoundScreen(
            message = "대여 정보를 찾을 수 없습니다.",
            onBackClick = onBackClick
        )
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(horizontal = 20.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        IconButton(
            onClick = onBackClick,
            modifier = Modifier.size(40.dp)
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "뒤로가기",
                tint = Color.Black
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.Top
        ) {
            Image(
                painter = painterResource(id = rentalBook.book.imageRes),
                contentDescription = rentalBook.book.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .width(118.dp)
                    .height(164.dp)
                    .clip(RoundedCornerShape(8.dp))
            )

            Spacer(modifier = Modifier.width(18.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = rentalBook.book.title,
                    color = Color.Black,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = rentalBook.book.author,
                    color = Color(0xFF555555),
                    fontSize = 15.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.Star,
                        contentDescription = "평점",
                        tint = Color(0xFFE0B341),
                        modifier = Modifier.size(18.dp)
                    )

                    Spacer(modifier = Modifier.width(4.dp))

                    Text(
                        text = "${rentalBook.rating} (${rentalBook.reviewCount})",
                        color = Color(0xFF555555),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        RentalInfoPanel(rentalBook = rentalBook)

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = { onRequestRentalClick(rentalBook) },
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF5B5CE2),
                contentColor = Color.White
            ),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp)
        ) {
            Text(
                text = "대여 요청하기",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(28.dp))
    }
}

@Composable
fun ChatScreen(
    rentalBook: RentalBook?,
    initialMessages: List<ChatMessage>,
    onBackClick: () -> Unit,
    onSendMessage: (String) -> ChatMessage,
    onCompleteAgreement: () -> Unit
) {
    if (rentalBook == null) {
        SimpleNotFoundScreen(
            message = "채팅 정보를 찾을 수 없습니다.",
            onBackClick = onBackClick
        )
        return
    }

    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    var inputText by remember { mutableStateOf("") }
    var messages by remember(initialMessages) { mutableStateOf(initialMessages) }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(horizontal = 18.dp)
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBackClick) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "뒤로가기",
                    tint = Color.Black
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = rentalBook.owner,
                    color = Color.Black,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = rentalBook.book.title,
                    color = Color(0xFF777777),
                    fontSize = 12.sp
                )
            }

            Button(
                onClick = {
                    coroutineScope.launch {
                        Toast.makeText(
                            context,
                            "상대의 동의 완료를 처리합니다.",
                            Toast.LENGTH_SHORT
                        ).show()
                        delay(500)
                        onCompleteAgreement()
                        Toast.makeText(
                            context,
                            "대여 완료 처리되었습니다.",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF5B5CE2),
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "동의 완료",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            state = listState,
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(messages, key = { it.messageId }) { message ->
                ChatBubble(message = message)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                placeholder = { Text("메시지를 입력하세요") },
                singleLine = true,
                modifier = Modifier.weight(1f)
            )

            Spacer(modifier = Modifier.width(10.dp))

            Button(
                onClick = {
                    val text = inputText.trim()
                    if (text.isNotEmpty()) {
                        val message = onSendMessage(text)
                        messages = messages + message
                        inputText = ""
                    }
                },
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF5B5CE2),
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("전송")
            }
        }

        Spacer(modifier = Modifier.height(18.dp))
    }
}

@Composable
fun MyPageScreen(
    borrowedBooks: List<BorrowedBook>,
    myBooks: List<MyBook>,
    initialTab: MyPageTab = MyPageTab.BORROWED,
    onAddBookClick: () -> Unit,
    onBorrowedBookClick: (BorrowedBook) -> Unit,
    onMyBookClick: (MyBook) -> Unit,
    onHomeClick: () -> Unit,
    onSearchClick: () -> Unit,
    onMyPageClick: () -> Unit
) {
    var selectedTab by remember(initialTab) { mutableStateOf(initialTab) }

    Scaffold(
        bottomBar = {
            BottomNavigationBar(
                selectedDestination = BottomNavDestination.MY_PAGE,
                onHomeClick = onHomeClick,
                onSearchClick = onSearchClick,
                onMyPageClick = onMyPageClick
            )
        },
        containerColor = Color.White
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 20.dp)
        ) {
            Spacer(modifier = Modifier.height(20.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Spacer(modifier = Modifier.size(28.dp))
                Text(
                    text = "마이페이지",
                    color = Color.Black,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Center
                )
                Icon(
                    imageVector = Icons.Outlined.Settings,
                    contentDescription = "설정",
                    tint = Color(0xFF555555),
                    modifier = Modifier.size(28.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            MyPageTabs(
                selectedTab = selectedTab,
                onTabSelected = { selectedTab = it }
            )

            Spacer(modifier = Modifier.height(16.dp))

            when (selectedTab) {
                MyPageTab.BORROWED -> BorrowedBookList(
                    borrowedBooks = borrowedBooks,
                    onBorrowedBookClick = onBorrowedBookClick
                )

                MyPageTab.MY_BOOKS -> MyBookList(
                    myBooks = myBooks,
                    onMyBookClick = onMyBookClick,
                    onAddBookClick = onAddBookClick
                )
            }
        }
    }
}

@Composable
fun AddBookScreen(
    onBackClick: () -> Unit,
    onSaveClick: (
        title: String,
        author: String,
        publisher: String,
        coverImageUri: String?
    ) -> Unit
) {
    val context = LocalContext.current
    var title by remember { mutableStateOf("") }
    var author by remember { mutableStateOf("") }
    var publisher by remember { mutableStateOf("") }
    var coverImageUri by remember { mutableStateOf<String?>(null) }

    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            runCatching {
                context.contentResolver.takePersistableUriPermission(
                    uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION
                )
            }
            coverImageUri = uri.toString()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(horizontal = 20.dp)
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        Box(
            modifier = Modifier.fillMaxWidth(),
            contentAlignment = Alignment.Center
        ) {
            IconButton(
                onClick = onBackClick,
                modifier = Modifier.align(Alignment.CenterStart)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "뒤로가기",
                    tint = Color.Black
                )
            }

            Text(
                text = "책 추가하기",
                color = Color.Black,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(22.dp))

        CoverPicker(
            coverImageUri = coverImageUri,
            onClick = { imagePicker.launch(arrayOf("image/*")) }
        )

        Spacer(modifier = Modifier.height(20.dp))

        OutlinedTextField(
            value = title,
            onValueChange = { title = it },
            placeholder = { Text("책 제목 입력") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = author,
            onValueChange = { author = it },
            placeholder = { Text("저자 입력") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(12.dp))

        OutlinedTextField(
            value = publisher,
            onValueChange = { publisher = it },
            placeholder = { Text("출판사 입력 (선택)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(20.dp))

        Button(
            onClick = {
                onSaveClick(
                    title.trim(),
                    author.trim(),
                    publisher.trim(),
                    coverImageUri
                )
            },
            enabled = title.isNotBlank() && author.isNotBlank(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF5B5CE2),
                contentColor = Color.White,
                disabledContainerColor = Color(0xFFC8C8D8),
                disabledContentColor = Color.White
            ),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
        ) {
            Text(
                text = "저장하기",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
fun ReadingLogScreen(
    readingLog: ReadingLog?,
    comments: List<ReadingComment>,
    onBackClick: () -> Unit,
    onSavePage: (currentPage: Int, totalPage: Int) -> ReadingLog?,
    onSaveQuote: (quote: String) -> ReadingLog?,
    onSaveReview: (review: String) -> ReadingLog?
) {
    if (readingLog == null) {
        SimpleNotFoundScreen(
            message = "독서 기록을 찾을 수 없습니다.",
            onBackClick = onBackClick
        )
        return
    }

    var currentPage by remember(readingLog.readingLogId) { mutableIntStateOf(readingLog.currentPage) }
    var totalPageText by remember(readingLog.readingLogId) { mutableStateOf(readingLog.totalPage.toString()) }
    var directPageText by remember(readingLog.readingLogId) { mutableStateOf(readingLog.currentPage.toString()) }
    var quote by remember(readingLog.readingLogId) { mutableStateOf(readingLog.quote) }
    var review by remember(readingLog.readingLogId) { mutableStateOf(readingLog.review) }

    val totalPage = totalPageText.toIntOrNull()?.coerceAtLeast(1) ?: 1
    val progress = (currentPage.toFloat() / totalPage.toFloat()).coerceIn(0f, 1f)
    val progressPercent = (progress * 100).toInt()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(horizontal = 18.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        ReadingLogHeader(onBackClick = onBackClick)

        Spacer(modifier = Modifier.height(12.dp))

        ReadingLogTabs()

        Spacer(modifier = Modifier.height(18.dp))

        ReadingProgressSection(
            currentPage = currentPage,
            totalPage = totalPage,
            progress = progress,
            progressPercent = progressPercent
        )

        Spacer(modifier = Modifier.height(18.dp))

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

        Spacer(modifier = Modifier.height(16.dp))

        TextRecordSection(
            title = "기억에 남는 문장",
            value = quote,
            placeholder = "기억에 남는 문장을 입력하세요",
            onValueChange = { quote = it },
            onSaveClick = {
                onSaveQuote(quote)?.let { updated ->
                    quote = updated.quote
                }
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        TextRecordSection(
            title = "나의 감상",
            value = review,
            placeholder = "나의 감상을 입력하세요",
            onValueChange = { review = it },
            onSaveClick = {
                onSaveReview(review)?.let { updated ->
                    review = updated.review
                }
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        TogetherSection(comments = comments)

        Spacer(modifier = Modifier.height(28.dp))
    }
}

// 이제 컴포넌트 들에 대한 정의

@Composable
fun TopHeader() {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "서로서가",
            color = Color(0xFF5B5CE2),
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f)
        )

        Icon(
            imageVector = Icons.Outlined.Notifications,
            contentDescription = "알림",
            tint = Color.Black,
            modifier = Modifier.size(24.dp)
        )
    }
}

@Composable
fun SearchBar(
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFFF8F8FA))
            .clickable { onClick() }
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "찾고 싶은 책을 검색해보세요",
            color = Color(0xFF9E9E9E),
            fontSize = 14.sp,
            modifier = Modifier.weight(1f)
        )

        Icon(
            imageVector = Icons.Outlined.Search,
            contentDescription = "검색",
            tint = Color.Black,
            modifier = Modifier.size(24.dp)
        )
    }
}

@Composable
fun SectionHeader(
    title: String,
    showRegisterButton: Boolean,
    onMoreClick: () -> Unit,
    onRegisterClick: (() -> Unit)? = null
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black,
                modifier = Modifier.weight(1f)
            )

            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clickable { onMoreClick() }
            ) {
                Text(
                    text = "더보기",
                    fontSize = 12.sp,
                    color = Color(0xFF7D7D7D)
                )
                Text(
                    text = " >",
                    fontSize = 14.sp,
                    color = Color(0xFF7D7D7D)
                )
            }
        }

        if (showRegisterButton) {
            Spacer(modifier = Modifier.height(10.dp))

            Button(
                onClick = { onRegisterClick?.invoke() },
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = Color(0xFF5B5CE2)
                ),
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                modifier = Modifier.height(34.dp)
            ) {
                Text(
                    text = "+ 책 등록",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun BookHorizontalList(
    books: List<Book>,
    onBookClick: (Book) -> Unit
) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        itemsIndexed(books) { _, book ->
            BookCard(
                book = book,
                onClick = { onBookClick(book) }
            )
        }
    }
}

@Composable
fun BookCard(
    book: Book,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(82.dp)
            .clickable { onClick() }
    ) {
        Box {
            Image(
                painter = painterResource(id = book.imageRes),
                contentDescription = book.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .width(82.dp)
                    .height(118.dp)
                    .clip(RoundedCornerShape(6.dp))
            )

            if (book.rank != null) {
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(if (book.rank == 1) Color.Black else Color(0xFFE0C16B)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = book.rank.toString(),
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = book.title,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Black,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )

        Spacer(modifier = Modifier.height(2.dp))

        Text(
            text = book.author,
            fontSize = 11.sp,
            color = Color(0xFF777777),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )

        Spacer(modifier = Modifier.height(5.dp))

        Text(
            text = book.status,
            fontSize = 10.sp,
            color = Color(0xFF5B5CE2),
            modifier = Modifier
                .clip(RoundedCornerShape(5.dp))
                .background(Color(0xFFEDEBFF))
                .padding(horizontal = 6.dp, vertical = 3.dp)
        )
    }
}

@Composable
fun PageTopBar(
    title: String,
    onBackClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(60.dp)
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onBackClick) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "뒤로가기",
                tint = Color.Black
            )
        }

        Text(
            text = title,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Black,
            modifier = Modifier.weight(1f)
        )

        Spacer(modifier = Modifier.size(48.dp))
    }
}

@Composable
fun RecommendationSummary() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFFF6F5FF))
            .padding(16.dp)
    ) {
        Text(
            text = "AI가 고른 오늘의 독서 후보",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Black
        )

        Spacer(modifier = Modifier.height(6.dp))

        Text(
            text = "지금 관심 주제와 최근 독서 흐름을 반영해 바로 읽기 좋은 책을 추천합니다.",
            fontSize = 13.sp,
            color = Color(0xFF5D5D66),
            lineHeight = 19.sp
        )
    }
}

@Composable
fun RecommendationListItem(
    guide: AIGuide,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFFFAFAFC))
            .clickable { onClick() }
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Image(
            painter = painterResource(id = guide.book.imageRes),
            contentDescription = guide.book.title,
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .width(64.dp)
                .height(92.dp)
                .clip(RoundedCornerShape(6.dp))
        )

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "${guide.matchRate}% 매칭",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF5B5CE2),
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFFEDEBFF))
                        .padding(horizontal = 7.dp, vertical = 4.dp)
                )

                Spacer(modifier = Modifier.width(6.dp))

                Text(
                    text = guide.book.status,
                    fontSize = 11.sp,
                    color = Color(0xFF2F8F5B)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = guide.book.title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Text(
                text = guide.book.author,
                fontSize = 12.sp,
                color = Color(0xFF777777),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = guide.reason,
                fontSize = 12.sp,
                color = Color(0xFF4A4A4A),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                lineHeight = 17.sp
            )
        }
    }
}

@Composable
fun GuideHero(guide: AIGuide) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFFF8F8FA))
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
                painter = painterResource(id = guide.book.imageRes),
                contentDescription = guide.book.title,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .width(86.dp)
                    .height(124.dp)
                    .clip(RoundedCornerShape(8.dp))
            )

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "${guide.matchRate}% 추천",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFF5B5CE2))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = guide.book.title,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Text(
                    text = guide.book.author,
                    fontSize = 13.sp,
                    color = Color(0xFF777777)
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Outlined.Schedule,
                        contentDescription = null,
                        tint = Color(0xFF5B5CE2),
                        modifier = Modifier.size(17.dp)
                    )
                    Spacer(modifier = Modifier.width(5.dp))
                    Text(
                        text = guide.readingTime,
                        fontSize = 12.sp,
                        color = Color(0xFF555555)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            guide.tags.forEach { tag ->
                Text(
                    text = "#$tag",
                    fontSize = 12.sp,
                    color = Color(0xFF5B5CE2),
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color.White)
                        .padding(horizontal = 9.dp, vertical = 5.dp)
                )
            }
        }
    }
}

@Composable
fun AiGuideIntro(reason: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFFF4F6FF))
            .padding(14.dp),
        verticalAlignment = Alignment.Top
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Color.White),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Outlined.StarBorder,
                contentDescription = null,
                tint = Color(0xFF5B5CE2),
                modifier = Modifier.size(18.dp)
            )
        }

        Spacer(modifier = Modifier.width(10.dp))

        Text(
            text = reason,
            fontSize = 13.sp,
            color = Color(0xFF34343A),
            lineHeight = 19.sp,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun GuideMenuRow(
    title: String,
    iconColor: Color,
    icon: @Composable () -> Unit,
    lines: List<String> = emptyList(),
    chips: List<String> = emptyList()
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(Color.White)
            .padding(horizontal = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(iconColor),
                contentAlignment = Alignment.Center
            ) {
                icon()
            }

            Spacer(modifier = Modifier.width(10.dp))

            Text(
                text = title,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1F1F24),
                modifier = Modifier.weight(1f)
            )

            Text(
                text = ">",
                fontSize = 18.sp,
                color = Color(0xFFB0B0B8)
            )
        }

        if (lines.isNotEmpty() || chips.isNotEmpty()) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Color(0xFFF8F8FA))
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                lines.forEach { line ->
                    Text(
                        text = line,
                        fontSize = 13.sp,
                        color = Color(0xFF44444A),
                        lineHeight = 18.sp
                    )
                }

                if (chips.isNotEmpty()) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        chips.forEach { chip ->
                            Text(
                                text = chip,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF5B5CE2),
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(0xFFEDEBFF))
                                    .padding(horizontal = 9.dp, vertical = 5.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}

@Composable
fun GuideSection(
    title: String,
    icon: @Composable () -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFFFAFAFC))
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            icon()
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = title,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black
            )
        }

        Spacer(modifier = Modifier.height(12.dp))

        content()
    }
}

@Composable
fun NumberedGuideRow(
    index: Int,
    text: String
) {
    Row(verticalAlignment = Alignment.Top) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFF5B5CE2)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = index.toString(),
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }

        Spacer(modifier = Modifier.width(10.dp))

        Text(
            text = text,
            fontSize = 14.sp,
            color = Color(0xFF333333),
            lineHeight = 20.sp,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun ChecklistRow(text: String) {
    Row(verticalAlignment = Alignment.Top) {
        Icon(
            imageVector = Icons.Outlined.CheckCircle,
            contentDescription = null,
            tint = Color(0xFF5B5CE2),
            modifier = Modifier.size(20.dp)
        )

        Spacer(modifier = Modifier.width(9.dp))

        Text(
            text = text,
            fontSize = 14.sp,
            color = Color(0xFF333333),
            lineHeight = 20.sp,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
fun BottomNavigationBar(
    selectedDestination: BottomNavDestination,
    onHomeClick: () -> Unit,
    onSearchClick: () -> Unit,
    onMyPageClick: () -> Unit
) {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 4.dp
    ) {
        NavigationBarItem(
            selected = selectedDestination == BottomNavDestination.HOME,
            onClick = onHomeClick,
            icon = {
                Icon(Icons.Filled.Home, contentDescription = "홈")
            },
            label = {
                Text("홈")
            },
            colors = navigationBarItemColors(selectedDestination == BottomNavDestination.HOME)
        )

        NavigationBarItem(
            selected = selectedDestination == BottomNavDestination.SEARCH,
            onClick = onSearchClick,
            icon = {
                Icon(Icons.Outlined.Search, contentDescription = "검색")
            },
            label = {
                Text("검색")
            },
            colors = navigationBarItemColors(selectedDestination == BottomNavDestination.SEARCH)
        )

        NavigationBarItem(
            selected = selectedDestination == BottomNavDestination.MY_PAGE,
            onClick = onMyPageClick,
            icon = {
                Icon(Icons.Outlined.Person, contentDescription = "마이페이지")
            },
            label = {
                Text("마이페이지")
            },
            colors = navigationBarItemColors(selectedDestination == BottomNavDestination.MY_PAGE)
        )
    }
}

@Composable
private fun navigationBarItemColors(selected: Boolean) =
    NavigationBarItemDefaults.colors(
        selectedIconColor = Color(0xFF5B5CE2),
        selectedTextColor = Color(0xFF5B5CE2),
        unselectedIconColor = Color(0xFF888888),
        unselectedTextColor = Color(0xFF888888),
        indicatorColor = if (selected) Color(0xFFEDEBFF) else Color.Transparent
    )

@Composable
private fun RentalInfoPanel(rentalBook: RentalBook) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Color(0xFFFAFAFC))
    ) {
        RentalInfoRow(label = "대여료", value = rentalBook.rentalFee)
        RentalDivider()
        RentalInfoRow(label = "책 상태", value = rentalBook.condition)
        RentalDivider()
        RentalInfoRow(label = "보유자", value = rentalBook.owner)
        RentalDivider()
        RentalInfoRow(label = "위치", value = rentalBook.location)
    }
}

@Composable
private fun RentalInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp, vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            color = Color.Black,
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium
        )

        Text(
            text = value,
            color = Color(0xFF4F50C8),
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun RentalDivider() {
    HorizontalDivider(
        color = Color(0xFFE9E9EF),
        thickness = 1.dp,
        modifier = Modifier.padding(horizontal = 18.dp)
    )
}

@Composable
private fun ChatBubble(message: ChatMessage) {
    val isMine = message.senderType == SenderType.ME
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start
    ) {
        Text(
            text = message.text,
            color = if (isMine) Color.White else Color.Black,
            fontSize = 14.sp,
            modifier = Modifier
                .widthIn(max = 260.dp)
                .background(
                    color = if (isMine) Color(0xFF5B5CE2) else Color(0xFFF2F2F7),
                    shape = RoundedCornerShape(
                        topStart = 14.dp,
                        topEnd = 14.dp,
                        bottomStart = if (isMine) 14.dp else 4.dp,
                        bottomEnd = if (isMine) 4.dp else 14.dp
                    )
                )
                .padding(horizontal = 14.dp, vertical = 10.dp)
        )
    }
}

@Composable
private fun MyPageTabs(
    selectedTab: MyPageTab,
    onTabSelected: (MyPageTab) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        MyPageTabButton(
            text = "대여한 책",
            selected = selectedTab == MyPageTab.BORROWED,
            modifier = Modifier.weight(1f),
            onClick = { onTabSelected(MyPageTab.BORROWED) }
        )
        MyPageTabButton(
            text = "직접 추가한 책",
            selected = selectedTab == MyPageTab.MY_BOOKS,
            modifier = Modifier.weight(1f),
            onClick = { onTabSelected(MyPageTab.MY_BOOKS) }
        )
    }
}

@Composable
private fun MyPageTabButton(
    text: String,
    selected: Boolean,
    modifier: Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .height(42.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) Color(0xFF5B5CE2) else Color.White)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (selected) Color.White else Color(0xFF555555),
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun BorrowedBookList(
    borrowedBooks: List<BorrowedBook>,
    onBorrowedBookClick: (BorrowedBook) -> Unit
) {
    if (borrowedBooks.isEmpty()) {
        EmptyListMessage("대여한 책이 없습니다.")
        return
    }

    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(borrowedBooks, key = { it.borrowedId }) { borrowedBook ->
            BookRowCard(
                title = borrowedBook.rentalBook.book.title,
                author = borrowedBook.rentalBook.book.author,
                trailingText = "대여 중",
                imageContent = {
                    Image(
                        painter = painterResource(id = borrowedBook.rentalBook.book.imageRes),
                        contentDescription = borrowedBook.rentalBook.book.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(width = 58.dp, height = 76.dp)
                            .clip(RoundedCornerShape(6.dp))
                    )
                },
                onClick = { onBorrowedBookClick(borrowedBook) }
            )
        }
    }
}

@Composable
private fun MyBookList(
    myBooks: List<MyBook>,
    onMyBookClick: (MyBook) -> Unit,
    onAddBookClick: () -> Unit
) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(myBooks, key = { it.myBookId }) { myBook ->
            BookRowCard(
                title = myBook.title,
                author = myBook.author,
                trailingText = "직접 추가",
                imageContent = { MyBookCover(myBook = myBook) },
                onClick = { onMyBookClick(myBook) }
            )
        }

        item {
            AddBookCard(onClick = onAddBookClick)
        }
    }
}

@Composable
private fun BookRowCard(
    title: String,
    author: String,
    trailingText: String,
    imageContent: @Composable () -> Unit,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(Color.White)
            .clickable { onClick() }
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        imageContent()

        Column(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 12.dp)
        ) {
            Text(
                text = title,
                color = Color.Black,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = author,
                color = Color(0xFF555555),
                fontSize = 13.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        Text(
            text = trailingText,
            color = Color(0xFF4CAF50),
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun MyBookCover(myBook: MyBook) {
    if (myBook.coverImageUri != null) {
        UriImage(
            uriString = myBook.coverImageUri,
            contentDescription = myBook.title,
            modifier = Modifier
                .size(width = 58.dp, height = 76.dp)
                .clip(RoundedCornerShape(6.dp))
        )
    } else {
        PlaceholderCover()
    }
}

@Composable
private fun PlaceholderCover() {
    Box(
        modifier = Modifier
            .size(width = 58.dp, height = 76.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(Color(0xFFEDEBFF)),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = "책",
            color = Color(0xFF5B5CE2),
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun AddBookCard(onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(96.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFFFAFAFC))
            .clickable { onClick() },
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Outlined.Add,
            contentDescription = "책 추가하기",
            tint = Color(0xFF5B5CE2),
            modifier = Modifier.size(24.dp)
        )
        Text(
            text = "책 추가하기",
            color = Color.Black,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}

@Composable
private fun EmptyListMessage(text: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(180.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = Color(0xFF777777),
            fontSize = 14.sp
        )
    }
}

@Composable
private fun CoverPicker(
    coverImageUri: String?,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(150.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFFFAFAFC))
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        if (coverImageUri != null) {
            UriImage(
                uriString = coverImageUri,
                contentDescription = "선택한 표지 사진",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        } else {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Outlined.Add,
                    contentDescription = "표지 사진 선택",
                    tint = Color(0xFF5B5CE2),
                    modifier = Modifier.size(34.dp)
                )
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "표지 사진 선택",
                    color = Color(0xFF555555),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
private fun ReadingLogHeader(onBackClick: () -> Unit) {
    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        IconButton(
            onClick = onBackClick,
            modifier = Modifier.align(Alignment.CenterStart)
        ) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "뒤로가기",
                tint = Color.Black
            )
        }
        Text(
            text = "독서 기록",
            color = Color.Black,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        Icon(
            imageVector = Icons.Outlined.Settings,
            contentDescription = "설정",
            tint = Color(0xFF555555),
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .size(24.dp)
        )
    }
}

@Composable
private fun ReadingLogTabs() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFFF4F4F0)),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .height(30.dp)
                .padding(start = 3.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFF7B8A63)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "기록",
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
        }
        Box(
            modifier = Modifier.weight(1f),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "커뮤니티",
                color = Color(0xFF777777),
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun ReadingProgressSection(
    currentPage: Int,
    totalPage: Int,
    progress: Float,
    progressPercent: Int
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFFFAFAF7))
            .padding(14.dp)
    ) {
        Text(
            text = "독서 진행률",
            color = Color.Black,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            LinearProgressIndicator(
                progress = { progress },
                color = Color(0xFF7B8A63),
                trackColor = Color(0xFFE8E8E0),
                modifier = Modifier
                    .weight(1f)
                    .height(8.dp)
                    .clip(RoundedCornerShape(10.dp))
            )
            Text(
                text = "$progressPercent%",
                color = Color(0xFF7B8A63),
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(start = 12.dp)
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        Text(
            text = "현재 페이지 $currentPage / ${totalPage}p",
            color = Color(0xFF555555),
            fontSize = 13.sp
        )
        Text(
            text = "전체 분량 ${totalPage}p",
            color = Color(0xFF555555),
            fontSize = 13.sp
        )
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
    Column(modifier = Modifier.fillMaxWidth()) {
        SectionTitle("현재 페이지 기록")

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = onMinusClick,
                colors = mutedButtonColors(),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.size(44.dp)
            ) {
                Text("-")
            }
            OutlinedTextField(
                value = directPageText,
                onValueChange = onDirectPageChange,
                singleLine = true,
                textStyle = TextStyle(
                    textAlign = TextAlign.Center,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                ),
                modifier = Modifier.weight(1f)
            )
            Text(
                text = "/",
                color = Color(0xFF999999),
                fontSize = 14.sp
            )
            OutlinedTextField(
                value = totalPageText,
                onValueChange = onTotalPageChange,
                singleLine = true,
                suffix = { Text("p") },
                modifier = Modifier.weight(1f)
            )
            Button(
                onClick = onPlusClick,
                colors = mutedButtonColors(),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.size(44.dp)
            ) {
                Text("+")
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = onSaveClick,
            colors = mutedButtonColors(),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(42.dp)
        ) {
            Text("직접 입력하기")
        }

        Text(
            text = "- / + 버튼 또는 직접 입력으로 현재 페이지를 기록합니다.",
            color = Color(0xFF999999),
            fontSize = 11.sp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
            textAlign = TextAlign.Center
        )
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
    Column(modifier = Modifier.fillMaxWidth()) {
        SectionTitle(title)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder) },
            minLines = 4,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            Button(
                onClick = onSaveClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF7B8A63),
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("저장하기")
            }
        }
    }
}

@Composable
private fun TogetherSection(comments: List<ReadingComment>) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "같이 읽는 사람들",
                color = Color.Black,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f)
            )
            Text(
                text = "더보기>",
                color = Color(0xFF777777),
                fontSize = 12.sp
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        comments.forEach { comment ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(RoundedCornerShape(50))
                        .background(Color(0xFFEDEBFF)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = comment.commenterName.take(1),
                        color = Color(0xFF5B5CE2),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(start = 10.dp)
                ) {
                    Text(
                        text = comment.commenterName,
                        color = Color.Black,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = comment.text,
                        color = Color(0xFF777777),
                        fontSize = 12.sp
                    )
                }
                Icon(
                    imageVector = Icons.Outlined.Favorite,
                    contentDescription = "좋아요",
                    tint = Color(0xFF7B8A63),
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = comment.likeCount.toString(),
                    color = Color(0xFF555555),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }
        }
    }
}

@Composable
private fun SectionTitle(title: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            color = Color.Black,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f)
        )
        Icon(
            imageVector = Icons.Outlined.BookmarkBorder,
            contentDescription = null,
            tint = Color(0xFF7B8A63),
            modifier = Modifier.size(18.dp)
        )
    }
}

@Composable
private fun mutedButtonColors() =
    ButtonDefaults.buttonColors(
        containerColor = Color(0xFFF4F4F0),
        contentColor = Color(0xFF555555)
    )

@Composable
private fun PlaceholderScreen(
    title: String,
    description: String,
    onBackClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(20.dp)
    ) {
        PageTopBar(
            title = title,
            onBackClick = onBackClick
        )
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = description,
                color = Color(0xFF555555),
                fontSize = 15.sp,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun SimpleNotFoundScreen(
    message: String,
    onBackClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(18.dp)
    ) {
        IconButton(onClick = onBackClick) {
            Icon(
                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "뒤로가기",
                tint = Color.Black
            )
        }
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = message,
            color = Color(0xFF555555),
            fontSize = 15.sp
        )
    }
}

@Composable
private fun UriImage(
    uriString: String,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Crop
) {
    val context = LocalContext.current
    val imageBitmap = remember(uriString) {
        runCatching {
            context.contentResolver.openInputStream(Uri.parse(uriString))?.use { inputStream ->
                BitmapFactory.decodeStream(inputStream)?.asImageBitmap()
            }
        }.getOrNull()
    }

    if (imageBitmap != null) {
        Image(
            bitmap = imageBitmap,
            contentDescription = contentDescription,
            contentScale = contentScale,
            modifier = modifier
        )
    }
}

// 여기서부터 db 모아 놓은 부분 -> 대여 가능 책들 , ai 가 추천하는 책들등등 모든 목데이터들

fun sampleRentalBooks(): List<RentalBook> {
    val books = listOf(
        Book(
            id = "rental-book-1",
            title = "아몬드",
            author = "손원평",
            imageRes = R.drawable.book_almond,
            rank = 1
        ),
        Book(
            id = "rental-book-2",
            title = "불편한 편의점",
            author = "김호연",
            imageRes = R.drawable.book_store,
            rank = 2
        ),
        Book(
            id = "rental-book-3",
            title = "데미안",
            author = "헤르만 헤세",
            imageRes = R.drawable.book_demian,
            rank = 3
        ),
        Book(
            id = "rental-book-4",
            title = "팩트풀니스",
            author = "한스 로슬링",
            imageRes = R.drawable.book_factfulness
        )
    )

    return listOf(
        RentalBook(
            rentalId = "rental-1",
            book = books[0],
            rank = 1,
            owner = "박지원",
            location = "부산대학교 중앙도서관"
        ),
        RentalBook(
            rentalId = "rental-2",
            book = books[1],
            rank = 2,
            owner = "최민서",
            location = "부산대학교 상남국제회관"
        ),
        RentalBook(
            rentalId = "rental-3",
            book = books[2],
            rank = 3,
            owner = "김도윤",
            location = "부산대학교 학생회관"
        ),
        RentalBook(
            rentalId = "rental-4",
            book = books[3],
            owner = "한지우",
            location = "부산대학교 인문관"
        )
    )
}

fun sampleMyBooks(): List<MyBook> =
    listOf(
        MyBook(
            myBookId = "my-book-initial-1",
            title = "역행자",
            author = "자청",
            publisher = "웅진지식하우스",
            addedAtMillis = System.currentTimeMillis()
        ),
        MyBook(
            myBookId = "my-book-initial-2",
            title = "아주 작은 습관의 힘",
            author = "제임스 클리어",
            publisher = "비즈니스북스",
            addedAtMillis = System.currentTimeMillis()
        )
    )

fun sampleReadingComments(): List<ReadingComment> =
    listOf(
        ReadingComment("민서", "문장이 잔잔해서 오래 기억에 남아요.", 12),
        ReadingComment("도윤", "후반부 인물 선택이 흥미로웠어요.", 7),
        ReadingComment("지우", "독서모임 질문으로 써도 좋을 것 같아요.", 4)
    )

fun sampleAiGuides(): List<AIGuide> {
    return listOf(
        AIGuide(
            book = Book(
                id = "ai-book-1",
                title = "역행자",
                author = "자청",
                imageRes = R.drawable.book_reverse
            ),
            matchRate = 96,
            reason = "최근 자기계발과 실행력에 관심을 보인 사용자에게 맞는 추천입니다. 가볍게 읽으면서 바로 실천 가능한 독서 목표를 만들기 좋습니다.",
            tags = listOf("자기계발", "실행력", "습관"),
            readingTime = "예상 5시간",
            backgroundKnowledge = listOf(
                "자기계발 장르 특성상 저자의 경험과 실행 방법이 함께 제시됩니다.",
                "배경지식보다 내 생활에 적용할 문장을 찾는 방식으로 읽으면 좋습니다."
            ),
            keywords = listOf("자의식", "실행", "경제적 자유"),
            bookQuestions = listOf(
                "내가 반복해서 미루고 있는 선택은 무엇인가?",
                "지금 바로 바꿀 수 있는 작은 행동은 무엇인가?"
            ),
            discussionTopics = listOf(
                "성공 경험을 일반화한 조언은 어디까지 신뢰할 수 있을까?",
                "좋은 습관을 만드는 데 개인 의지와 환경 중 무엇이 더 중요할까?"
            ),
            aiPrompts = listOf(
                "이 책의 핵심 내용을 5문장으로 요약해줘.",
                "내 상황에 맞는 실천 계획을 만들어줘."
            )
        ),
        AIGuide(
            book = Book(
                id = "ai-book-2",
                title = "아주 작은 습관의 힘",
                author = "제임스 클리어",
                imageRes = R.drawable.book_habit
            ),
            matchRate = 94,
            reason = "꾸준한 루틴을 만들고 싶은 사용자에게 어울립니다. 큰 목표보다 반복 가능한 행동 설계에 초점을 맞춘 책입니다.",
            tags = listOf("루틴", "습관형성", "목표관리"),
            readingTime = "예상 6시간",
            backgroundKnowledge = listOf(
                "습관은 신호, 갈망, 반응, 보상 구조로 설명됩니다.",
                "책을 읽기 전 바꾸고 싶은 습관 하나를 정하면 내용 적용이 쉽습니다."
            ),
            keywords = listOf("습관 루프", "환경 설계", "정체성"),
            bookQuestions = listOf(
                "좋은 습관을 방해하는 환경은 무엇인가?",
                "꾸준한 행동을 만들기 위한 가장 작은 시작은 무엇인가?"
            ),
            discussionTopics = listOf(
                "작은 변화가 큰 결과를 만든다는 주장에 동의하는가?",
                "목표보다 시스템이 중요하다는 관점은 얼마나 현실적인가?"
            ),
            aiPrompts = listOf(
                "내 일정에 맞는 습관 루틴을 추천해줘.",
                "이 책을 읽고 실천할 체크리스트를 만들어줘."
            )
        ),
        AIGuide(
            book = Book(
                id = "ai-book-3",
                title = "미디어의 이해",
                author = "마셜 맥루한",
                imageRes = R.drawable.book_media
            ),
            matchRate = 89,
            reason = "AI와 다양한 콘텐츠를 자주 소비하는 사용자에게 잘 맞습니다. 매체가 사고방식과 사회 관계를 어떻게 바꾸는지 비판적으로 보게 해줍니다.",
            tags = listOf("미디어", "사회", "비판적사고"),
            readingTime = "예상 7시간",
            backgroundKnowledge = listOf(
                "미디어 이론은 매체가 정보 전달을 넘어 사고 구조를 바꾼다고 봅니다.",
                "SNS와 영상 플랫폼을 떠올리며 읽으면 이해가 쉬워집니다."
            ),
            keywords = listOf("매체", "정보", "비판적 수용"),
            bookQuestions = listOf(
                "매체는 단순한 도구인가, 사고방식을 바꾸는 환경인가?",
                "정보 소비 습관은 나의 판단을 어떻게 바꾸는가?"
            ),
            discussionTopics = listOf(
                "AI 시대에 필요한 미디어 리터러시는 무엇일까?",
                "편리한 기술 사용과 비판적 거리두기는 공존할 수 있을까?"
            ),
            aiPrompts = listOf(
                "이 책의 주요 개념을 쉬운 예시로 설명해줘.",
                "토론에서 사용할 찬반 쟁점을 정리해줘."
            )
        ),
        AIGuide(
            book = Book(
                id = "ai-book-4",
                title = "인간 실격",
                author = "다자이 오사무",
                imageRes = R.drawable.book_human
            ),
            matchRate = 86,
            reason = "감정과 관계를 깊게 다루는 문학을 찾는 사용자에게 어울립니다. 따라가다 보면 공감과 거리두기를 함께 연습하게 됩니다.",
            tags = listOf("문학", "내면", "관계"),
            readingTime = "예상 4시간",
            backgroundKnowledge = listOf(
                "일본 근대문학의 대표작으로, 화자의 감정과 불안을 중심으로 전개됩니다.",
                "줄거리를 따라가기보다 서술자의 시선과 관계 방식을 읽어보면 좋습니다."
            ),
            keywords = listOf("소외", "가면", "자기고백"),
            bookQuestions = listOf(
                "화자는 왜 반복해서 자신을 숨기려 하는가?",
                "공감과 비판 사이에서 독자는 어떤 태도를 가져야 할까?"
            ),
            discussionTopics = listOf(
                "문학 속 불안과 현대인의 불안은 어떻게 연결될까?",
                "주인공의 선택은 개인 문제인가 사회적 문제인가?"
            ),
            aiPrompts = listOf(
                "주인공의 심리 변화를 단계별로 정리해줘.",
                "이 책으로 독서토론 질문 5개를 만들어줘."
            )
        )
    )
}
