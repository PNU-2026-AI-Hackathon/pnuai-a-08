package com.example.seoroseoga.data.model

data class RentalBook(
    val rentalId: String,
    val book: Book,
    val rank: Int? = null,
    val rentalStatus: String = "대여 가능",
    val rentalFee: String = "1,500원 / 1일",
    val condition: String = "좋음",
    val owner: String = "정승한",
    val location: String = "부산대학교 인문관",
    val rating: Float = 4.6f,
    val reviewCount: Int = 23
)
