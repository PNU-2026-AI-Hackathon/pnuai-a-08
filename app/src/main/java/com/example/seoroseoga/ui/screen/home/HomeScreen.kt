package com.example.seoroseoga.ui.screen.home

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.seoroseoga.data.model.Book
import com.example.seoroseoga.data.model.RentalBook
import com.example.seoroseoga.ui.component.BottomNavDestination
import com.example.seoroseoga.ui.component.BookHorizontalList
import com.example.seoroseoga.ui.component.BottomNavigationBar
import com.example.seoroseoga.ui.component.SearchBar
import com.example.seoroseoga.ui.component.SectionHeader
import com.example.seoroseoga.ui.component.TopHeader
import com.example.seoroseoga.ui.model.BookCardUiModel

@Composable
fun HomeScreen(
    rentalBooks: List<RentalBook>,
    aiRecommendedBooks: List<Book>,
    onRentalMoreClick: () -> Unit,
    onBookRegisterClick: () -> Unit,
    onRentalBookClick: (RentalBook) -> Unit,
    onAiMoreClick: () -> Unit,
    onAiBookClick: (Book) -> Unit,
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

            SearchBar()

            Spacer(modifier = Modifier.height(24.dp))

            SectionHeader(
                title = "대여 가능 책",
                showRegisterButton = true,
                onMoreClick = onRentalMoreClick,
                onRegisterClick = onBookRegisterClick
            )

            Spacer(modifier = Modifier.height(12.dp))

            BookHorizontalList(
                books = rentalBooks.map { rentalBook ->
                    rentalBook.toBookCardUiModel()
                },
                onBookClick = { selectedBook ->
                    rentalBooks.firstOrNull { it.rentalId == selectedBook.id }
                        ?.let(onRentalBookClick)
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
                books = aiRecommendedBooks.map { book ->
                    book.toBookCardUiModel()
                },
                onBookClick = { selectedBook ->
                    aiRecommendedBooks.firstOrNull { it.id == selectedBook.id }
                        ?.let(onAiBookClick)
                }
            )
        }
    }
}

private fun RentalBook.toBookCardUiModel(): BookCardUiModel =
    BookCardUiModel(
        id = rentalId,
        title = book.title,
        author = book.author,
        imageRes = book.imageRes,
        rank = rank,
        status = rentalStatus
    )

private fun Book.toBookCardUiModel(): BookCardUiModel =
    BookCardUiModel(
        id = id,
        title = title,
        author = author,
        imageRes = imageRes
    )
