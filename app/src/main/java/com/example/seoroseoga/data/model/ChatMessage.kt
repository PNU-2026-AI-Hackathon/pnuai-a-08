package com.example.seoroseoga.data.model

data class ChatMessage(
    val messageId: String,
    val chatRoomId: String,
    val senderType: SenderType,
    val text: String,
    val createdAtMillis: Long
)

enum class SenderType {
    ME,
    OWNER
}
