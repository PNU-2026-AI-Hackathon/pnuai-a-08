package com.example.seoroseoga.data.repository

import com.example.seoroseoga.data.local.ChatLocalDataSource
import com.example.seoroseoga.data.model.ChatMessage
import com.example.seoroseoga.data.model.ChatRoom

class ChatRepository(
    private val localDataSource: ChatLocalDataSource
) {
    fun getOrCreateChatRoom(rentalId: String): ChatRoom =
        localDataSource.getOrCreateChatRoom(rentalId)

    fun getChatRoom(chatRoomId: String): ChatRoom? =
        localDataSource.getChatRoom(chatRoomId)

    fun getMessages(chatRoomId: String): List<ChatMessage> =
        localDataSource.getMessages(chatRoomId)

    fun sendMessage(chatRoomId: String, text: String): ChatMessage =
        localDataSource.sendMessage(chatRoomId, text)

    fun completeAgreement(chatRoomId: String): ChatRoom? =
        localDataSource.completeAgreement(chatRoomId)
}
