package com.example.seoroseoga

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Lightbulb
import androidx.compose.material.icons.outlined.QuestionAnswer
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class Book(
    val title: String,
    val author: String,
    val imageRes: Int,
    val rank: Int? = null,
    val status: String = "대여 가능"
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

sealed interface AppScreen {
    data object Home : AppScreen
    data object AiRecommendations : AppScreen
    data class AiGuide(val guide: AIGuide) : AppScreen
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SeoroSeogaApp()
        }
    }
}

@Composable
fun SeoroSeogaApp() {
    MaterialTheme {
        val guides = remember { sampleAiGuides() }
        var screen by remember { mutableStateOf<AppScreen>(AppScreen.Home) }

        when (val currentScreen = screen) {
            AppScreen.Home -> HomeScreen(
                aiGuides = guides,
                onAiMoreClick = { screen = AppScreen.AiGuide(guides.first()) },
                onAiBookClick = { guide -> screen = AppScreen.AiGuide(guide) }
            )

            AppScreen.AiRecommendations -> AiRecommendationScreen(
                guides = guides,
                onBackClick = { screen = AppScreen.Home },
                onGuideClick = { guide -> screen = AppScreen.AiGuide(guide) }
            )

            is AppScreen.AiGuide -> AIGuideScreen(
                guide = currentScreen.guide,
                onBackClick = { screen = AppScreen.Home }
            )
        }
    }
}

@Composable
fun HomeScreen(
    aiGuides: List<AIGuide>,
    onAiMoreClick: () -> Unit,
    onAiBookClick: (AIGuide) -> Unit
) {
    val rentalBooks = listOf(
        Book("아몬드", "손원평", R.drawable.book_almond, rank = 1),
        Book("불편한 편의점", "김호연", R.drawable.book_store, rank = 2),
        Book("데미안", "헤르만 헤세", R.drawable.book_demian, rank = 3),
        Book("팩트풀니스", "한스 로슬링", R.drawable.book_factfulness)
    )

    Scaffold(
        bottomBar = {
            BottomNavigationBar()
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

            SearchBar()

            Spacer(modifier = Modifier.height(24.dp))

            SectionHeader(
                title = "대여 가능 책",
                showRegisterButton = true,
                onMoreClick = {
                    // TODO: 대여 가능 책 전체보기 화면 이동
                },
                onRegisterClick = {
                    // TODO: 책 등록 페이지 이동
                }
            )

            Spacer(modifier = Modifier.height(12.dp))

            BookHorizontalList(
                books = rentalBooks,
                onBookClick = { book ->
                    // TODO: 대여 상세 페이지 이동
                    // RentalDetailScreen(book)
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
                    aiGuides.firstOrNull { it.book.title == book.title }?.let(onAiBookClick)
                }
            )
        }
    }
}

@Composable
fun AiRecommendationScreen(
    guides: List<AIGuide>,
    onBackClick: () -> Unit,
    onGuideClick: (AIGuide) -> Unit
) {
    Scaffold(
        topBar = {
            PageTopBar(
                title = "AI 추천 도서",
                onBackClick = onBackClick
            )
        },
        bottomBar = { BottomNavigationBar() },
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
                title = "독서 가이드",
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
                    icon = { Text("i", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold) },
                    lines = listOf("상세 도서 정보 페이지로 연결 예정입니다.")
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
                    icon = { Text("#", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold) },
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
fun SearchBar() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(48.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Color(0xFFF8F8FA))
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "읽고 싶은 책을 검색해보세요",
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
                border = ButtonDefaults.outlinedButtonBorder,
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                modifier = Modifier.height(34.dp)
            ) {
                Text(
                    text = "+ 내 책 등록",
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
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        itemsIndexed(books) { index, book ->
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
                        .background(
                            if (book.rank == 1) Color.Black else Color(0xFFE0C16B)
                        ),
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
            text = "대여 가능 여부와 관심 주제를 함께 반영해 바로 읽기 좋은 책을 추천했어요.",
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
fun BottomNavigationBar() {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 4.dp
    ) {
        NavigationBarItem(
            selected = true,
            onClick = {
                // TODO: 홈 이동
            },
            icon = {
                Icon(Icons.Filled.Home, contentDescription = "홈")
            },
            label = {
                Text("홈")
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color(0xFF5B5CE2),
                selectedTextColor = Color(0xFF5B5CE2),
                indicatorColor = Color.Transparent
            )
        )

        NavigationBarItem(
            selected = false,
            onClick = {
                // TODO: 검색 화면 이동
            },
            icon = {
                Icon(Icons.Outlined.Search, contentDescription = "검색")
            },
            label = {
                Text("검색")
            },
            colors = NavigationBarItemDefaults.colors(
                unselectedIconColor = Color(0xFF888888),
                unselectedTextColor = Color(0xFF888888),
                indicatorColor = Color.Transparent
            )
        )

        NavigationBarItem(
            selected = false,
            onClick = {
                // TODO: 마이페이지 이동
            },
            icon = {
                Icon(Icons.Outlined.Person, contentDescription = "마이페이지")
            },
            label = {
                Text("마이페이지")
            },
            colors = NavigationBarItemDefaults.colors(
                unselectedIconColor = Color(0xFF888888),
                unselectedTextColor = Color(0xFF888888),
                indicatorColor = Color.Transparent
            )
        )
    }
}

fun sampleAiGuides(): List<AIGuide> {
    return listOf(
        AIGuide(
            book = Book("역행자", "자청", R.drawable.book_reverse),
            matchRate = 96,
            reason = "최근 자기계발과 실행 습관에 관심을 보인 사용자에게 맞춘 추천입니다. 가볍게 읽으면서 바로 실천할 수 있는 독서 목표를 만들기 좋습니다.",
            tags = listOf("자기계발", "실행력", "습관"),
            readingTime = "예상 5일 완독",
            backgroundKnowledge = listOf(
                "자기계발서 특성상 저자의 경험담과 실행 원칙이 함께 제시됩니다.",
                "완벽한 이해보다 내 생활에 적용할 수 있는 문장을 찾는 방식으로 읽으면 좋습니다."
            ),
            keywords = listOf("자의식", "실행", "경제적 자유"),
            bookQuestions = listOf("내가 반복해서 미루는 선택은 무엇인가요?", "지금 바로 바꿀 수 있는 작은 행동은 무엇인가요?"),
            discussionTopics = listOf("성공 경험을 일반화한 조언은 어디까지 신뢰할 수 있을까요?", "좋은 습관을 만드는 데 개인 의지와 환경 중 무엇이 더 중요할까요?"),
            aiPrompts = listOf("이 책의 핵심 내용을 5문장으로 요약해줘.", "내 상황에 맞는 실천 계획을 만들어줘.")
        ),
        AIGuide(
            book = Book("아주 작은 습관의 힘", "제임스 클리어", R.drawable.book_habit),
            matchRate = 94,
            reason = "꾸준한 독서 루틴을 만들고 싶은 사용자에게 적합합니다. 큰 목표보다 반복 가능한 행동 설계에 초점을 맞춘 책입니다.",
            tags = listOf("루틴", "습관형성", "목표관리"),
            readingTime = "예상 6일 완독",
            backgroundKnowledge = listOf(
                "습관은 신호, 열망, 반응, 보상의 반복 구조로 설명됩니다.",
                "책을 읽기 전 바꾸고 싶은 습관 하나를 정해두면 내용을 적용하기 쉽습니다."
            ),
            keywords = listOf("습관 루프", "환경 설계", "정체성"),
            bookQuestions = listOf("좋은 습관이 쉽게 반복되는 환경은 어떤 모습인가요?", "나쁜 습관을 어렵게 만드는 방법은 무엇인가요?"),
            discussionTopics = listOf("작은 변화가 큰 결과를 만든다는 주장은 현실적인가요?", "목표보다 시스템이 중요하다는 관점에 동의하나요?"),
            aiPrompts = listOf("내 하루 일정에 맞는 습관 루틴을 추천해줘.", "이 책을 읽고 실천할 체크리스트를 만들어줘.")
        ),
        AIGuide(
            book = Book("미디어의 이해", "김성", R.drawable.book_media),
            matchRate = 89,
            reason = "AI와 디지털 콘텐츠를 자주 접하는 사용자에게 추천합니다. 매체가 사고방식과 사회적 관계를 바꾸는 방식을 비판적으로 볼 수 있습니다.",
            tags = listOf("미디어", "사회", "비판적사고"),
            readingTime = "예상 7일 완독",
            backgroundKnowledge = listOf(
                "미디어 이론은 매체가 정보 전달을 넘어 사고와 관계를 바꾼다고 봅니다.",
                "SNS, 영상 플랫폼, AI 챗봇처럼 자주 쓰는 매체를 떠올리며 읽으면 이해가 쉽습니다."
            ),
            keywords = listOf("매체", "정보", "비판적 수용"),
            bookQuestions = listOf("매체는 단순한 도구인가요, 사고방식을 바꾸는 환경인가요?", "빠른 정보 소비는 판단력을 어떻게 바꾸나요?"),
            discussionTopics = listOf("AI 시대에 필요한 미디어 리터러시는 무엇일까요?", "편리한 기술 사용과 비판적 거리두기는 어떻게 공존할까요?"),
            aiPrompts = listOf("이 책의 주요 개념을 쉬운 예시로 설명해줘.", "토론에서 사용할 찬반 논점을 정리해줘.")
        ),
        AIGuide(
            book = Book("인간실격", "다자이 오사무", R.drawable.book_human),
            matchRate = 86,
            reason = "감정과 관계를 깊게 다루는 문학을 찾는 사용자에게 어울립니다. 인물의 내면을 따라가며 공감과 거리두기를 함께 연습할 수 있습니다.",
            tags = listOf("문학", "내면", "관계"),
            readingTime = "예상 4일 완독",
            backgroundKnowledge = listOf(
                "일본 근대문학의 대표작으로, 화자의 고백 형식을 통해 소외와 불안을 다룹니다.",
                "인물의 선택을 그대로 옳고 그름으로 판단하기보다 시대와 관계 속에서 읽어보면 좋습니다."
            ),
            keywords = listOf("소외", "가면", "자기고백"),
            bookQuestions = listOf("화자는 왜 타인 앞에서 자신을 숨기려고 하나요?", "공감과 비판 사이에서 독자는 어떤 태도를 가져야 할까요?"),
            discussionTopics = listOf("문학 속 불안과 현대인의 불안은 어떻게 연결될까요?", "주인공의 선택은 개인의 문제인가 사회의 문제인가요?"),
            aiPrompts = listOf("주인공의 심리 변화를 단계별로 정리해줘.", "이 책으로 독서토론 질문 5개를 만들어줘.")
        )
    )
}
