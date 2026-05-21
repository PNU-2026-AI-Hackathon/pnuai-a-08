package com.example.seoroseoga

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
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
        HomeScreen()
    }
}

@Composable
fun HomeScreen() {
    val rentalBooks = listOf(
        Book("아몬드", "손원평", R.drawable.book_almond, rank = 1),
        Book("불편한 편의점", "김호연", R.drawable.book_store, rank = 2),
        Book("데미안", "헤르만 헤세", R.drawable.book_demian, rank = 3),
        Book("팩트풀니스", "한스 로슬링", R.drawable.book_factfulness)
    )

    val aiBooks = listOf(
        Book("역행자", "자청", R.drawable.book_reverse),
        Book("아주 작은 습관의 힘", "제임스 클리어", R.drawable.book_habit),
        Book("미디어의 이해", "김성", R.drawable.book_media),
        Book("인간실격", "다자이 오사무", R.drawable.book_human)
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
                onMoreClick = {
                    // TODO: AI 추천 전체보기 화면 이동
                }
            )

            Spacer(modifier = Modifier.height(12.dp))

            BookHorizontalList(
                books = aiBooks,
                onBookClick = { book ->
                    // TODO: AI 독서 가이드 페이지 이동
                    // AIGuideScreen(book)
                }
            )
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