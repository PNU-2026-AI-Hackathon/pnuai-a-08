package com.example.seoroseoga.ui.screen.mypage

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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
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
import com.example.seoroseoga.data.model.BorrowedBook
import com.example.seoroseoga.data.model.MyBook
import com.example.seoroseoga.ui.component.BottomNavDestination
import com.example.seoroseoga.ui.component.BottomNavigationBar
import com.example.seoroseoga.ui.component.UriImage

enum class MyPageTab {
    BORROWED,
    MY_BOOKS
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
    var selectedTab by remember { mutableStateOf(initialTab) }

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
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
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

    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
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
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(myBooks, key = { it.myBookId }) { myBook ->
            BookRowCard(
                title = myBook.title,
                author = myBook.author,
                trailingText = "직접 추가",
                imageContent = {
                    MyBookCover(
                        myBook = myBook
                    )
                },
                onClick = { onMyBookClick(myBook) }
            )
        }

        item {
            AddBookCard(
                onClick = onAddBookClick
            )
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
private fun MyBookCover(
    myBook: MyBook
) {
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
private fun AddBookCard(
    onClick: () -> Unit
) {
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
private fun EmptyListMessage(
    text: String
) {
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
