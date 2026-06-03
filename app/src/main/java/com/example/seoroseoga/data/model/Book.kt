package com.example.seoroseoga.data.model

import androidx.annotation.DrawableRes

data class Book(
    val id: String,
    val title: String,
    val author: String,
    @DrawableRes val imageRes: Int,
    val description: String = ""
)
