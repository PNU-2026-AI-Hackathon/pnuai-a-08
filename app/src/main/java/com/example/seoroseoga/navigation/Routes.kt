package com.example.seoroseoga.navigation

object Routes {
    const val HOME = "home"
    const val RENTAL_DETAIL = "rentalDetail"
    const val CHAT = "chat"
    const val MY_PAGE = "myPage"
    const val ADD_BOOK = "addBook"
    const val READING_LOG = "readingLog"
    const val RENTAL_ID = "rentalId"
    const val CHAT_ROOM_ID = "chatRoomId"
    const val MY_PAGE_TAB = "tab"
    const val READING_SOURCE = "source"
    const val READING_BOOK_ID = "bookId"
    const val MY_PAGE_TAB_BORROWED = "borrowed"
    const val MY_PAGE_TAB_MY_BOOKS = "myBooks"

    const val RENTAL_DETAIL_ROUTE = "$RENTAL_DETAIL/{$RENTAL_ID}"
    const val CHAT_ROUTE = "$CHAT/{$CHAT_ROOM_ID}"
    const val MY_PAGE_ROUTE = "$MY_PAGE?$MY_PAGE_TAB={$MY_PAGE_TAB}"
    const val READING_LOG_ROUTE = "$READING_LOG/{$READING_SOURCE}/{$READING_BOOK_ID}"

    fun rentalDetail(rentalId: String): String = "$RENTAL_DETAIL/$rentalId"

    fun chat(chatRoomId: String): String = "$CHAT/$chatRoomId"

    fun myPage(tab: String = MY_PAGE_TAB_BORROWED): String = "$MY_PAGE?$MY_PAGE_TAB=$tab"

    fun readingLog(source: String, bookId: String): String = "$READING_LOG/$source/$bookId"
}
