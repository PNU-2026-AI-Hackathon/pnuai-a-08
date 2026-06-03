package com.example.seoroseoga.ui.model

import androidx.annotation.DrawableRes

data class BookCardUiModel(
    val id: String,
    val title: String,
    val author: String,
    @DrawableRes val imageRes: Int,
    val rank: Int? = null,
    val status: String? = null
)
