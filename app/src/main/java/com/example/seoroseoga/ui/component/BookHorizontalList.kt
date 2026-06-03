package com.example.seoroseoga.ui.component

import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import com.example.seoroseoga.ui.model.BookCardUiModel

@Composable
fun BookHorizontalList(
    books: List<BookCardUiModel>,
    onBookClick: (BookCardUiModel) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(books) { book ->
            BookCard(
                book = book,
                onClick = { onBookClick(book) }
            )
        }
    }
}
