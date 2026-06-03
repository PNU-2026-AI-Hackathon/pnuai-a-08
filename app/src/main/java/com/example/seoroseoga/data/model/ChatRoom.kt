package com.example.seoroseoga.data.model

data class ChatRoom(
    val chatRoomId: String,
    val rentalId: String,
    val status: ChatRoomStatus = ChatRoomStatus.REQUESTING
)

enum class ChatRoomStatus {
    REQUESTING,
    AGREEMENT_COMPLETED
}
