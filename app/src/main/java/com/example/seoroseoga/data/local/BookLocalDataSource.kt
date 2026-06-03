package com.example.seoroseoga.data.local

import com.example.seoroseoga.R
import com.example.seoroseoga.data.model.Book

object BookLocalDataSource {
    fun getAiRecommendedBooks(): List<Book> = listOf(
        Book(
            id = "book-reverse",
            title = "역행자",
            author = "자청",
            imageRes = R.drawable.book_reverse,
            description = "경제적 자유와 자기계발을 다루는 책"
        ),
        Book(
            id = "book-habit",
            title = "아주 작은 습관의 힘",
            author = "제임스 클리어",
            imageRes = R.drawable.book_habit,
            description = "작은 습관이 만드는 장기적 변화를 다루는 책"
        ),
        Book(
            id = "book-media",
            title = "미디어의 이해",
            author = "김성",
            imageRes = R.drawable.book_media,
            description = "미디어를 이해하는 관점을 다루는 책"
        ),
        Book(
            id = "book-human",
            title = "인간실격",
            author = "다자이 오사무",
            imageRes = R.drawable.book_human,
            description = "인간의 고독과 불안을 다루는 소설"
        )
    )

    fun getBookById(bookId: String): Book? =
        getAiRecommendedBooks().firstOrNull { it.id == bookId }
}
