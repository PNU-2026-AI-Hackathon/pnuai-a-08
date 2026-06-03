package com.example.seoroseoga.data.local

import com.example.seoroseoga.R
import com.example.seoroseoga.data.model.Book
import com.example.seoroseoga.data.model.RentalBook

object RentalBookLocalDataSource {
    fun getRentalBooks(): List<RentalBook> = listOf(
        RentalBook(
            rentalId = "rental-almond",
            book = Book(
                id = "book-almond",
                title = "아몬드",
                author = "손원평",
                imageRes = R.drawable.book_almond,
                description = "감정을 느끼기 어려운 소년의 성장을 다룬 장편소설"
            ),
            rank = 1,
            owner = "정승한",
            location = "부산대학교 인문관"
        ),
        RentalBook(
            rentalId = "rental-store",
            book = Book(
                id = "book-store",
                title = "불편한 편의점",
                author = "김호연",
                imageRes = R.drawable.book_store,
                description = "동네 편의점을 중심으로 사람들의 이야기를 담은 소설"
            ),
            rank = 2,
            owner = "정승한",
            location = "부산대학교 중앙도서관"
        ),
        RentalBook(
            rentalId = "rental-demian",
            book = Book(
                id = "book-demian",
                title = "데미안",
                author = "헤르만 헤세",
                imageRes = R.drawable.book_demian,
                description = "자아를 찾아가는 성장과 내면의 갈등을 다룬 소설"
            ),
            rank = 3,
            owner = "정승한",
            location = "부산대학교 정문"
        ),
        RentalBook(
            rentalId = "rental-factfulness",
            book = Book(
                id = "book-factfulness",
                title = "팩트풀니스",
                author = "한스 로슬링",
                imageRes = R.drawable.book_factfulness,
                description = "세상을 데이터 기반으로 이해하는 방법을 다룬 책"
            ),
            owner = "정승한",
            location = "부산대학교 인문관"
        )
    )

    fun getRentalBookById(rentalId: String): RentalBook? =
        getRentalBooks().firstOrNull { it.rentalId == rentalId }
}
