package com.example.seoroseoga.data.local

import android.content.Context
import com.example.seoroseoga.data.local.db.JsonFileStore
import com.example.seoroseoga.data.model.ChatMessage
import com.example.seoroseoga.data.model.ChatRoom
import com.example.seoroseoga.data.model.ChatRoomStatus
import com.example.seoroseoga.data.model.SenderType
import org.json.JSONArray
import org.json.JSONObject

// 지금은 로컬 json 기반 저장소 기준이라 결국은 아마 엎어야 할 듯?

class ChatLocalDataSource(
    context: Context
) {
    private val jsonFileStore = JsonFileStore(
        context = context,
        fileName = CHAT_DB_FILE_NAME,
        defaultJson = createDefaultJson()
    )

    fun getOrCreateChatRoom(rentalId: String): ChatRoom {
        val chatRoomId = createChatRoomId(rentalId)
        val json = jsonFileStore.read()
        val rooms = json.getJSONArray(KEY_ROOMS)
        val existingRoom = rooms.toChatRooms().firstOrNull {
            it.chatRoomId == chatRoomId
        }

        if (existingRoom != null) {
            return existingRoom
        }

        val chatRoom = ChatRoom(
            chatRoomId = chatRoomId,
            rentalId = rentalId
        )

        rooms.put(chatRoom.toJson())
        jsonFileStore.write(json)

        return chatRoom
    }

    fun getChatRoom(chatRoomId: String): ChatRoom? =
        jsonFileStore.read()
            .getJSONArray(KEY_ROOMS)
            .toChatRooms()
            .firstOrNull { it.chatRoomId == chatRoomId }

    fun getMessages(chatRoomId: String): List<ChatMessage> =
        jsonFileStore.read()
            .getJSONArray(KEY_MESSAGES)
            .toChatMessages()
            .filter { it.chatRoomId == chatRoomId }

    fun sendMessage(chatRoomId: String, text: String): ChatMessage {
        val createdAtMillis = System.currentTimeMillis()
        val message = ChatMessage(
            messageId = "message-$createdAtMillis",
            chatRoomId = chatRoomId,
            senderType = SenderType.ME,
            text = text,
            createdAtMillis = createdAtMillis
        )

        val json = jsonFileStore.read()
        json.getJSONArray(KEY_MESSAGES).put(message.toJson())
        jsonFileStore.write(json)

        return message
    }

    fun completeAgreement(chatRoomId: String): ChatRoom? {
        val json = jsonFileStore.read()
        val rooms = json.getJSONArray(KEY_ROOMS)
        val updatedRooms = JSONArray()
        var completedRoom: ChatRoom? = null

        rooms.toChatRooms().forEach { room ->
            val nextRoom = if (room.chatRoomId == chatRoomId) {
                room.copy(status = ChatRoomStatus.AGREEMENT_COMPLETED)
                    .also { completedRoom = it }
            } else {
                room
            }
            updatedRooms.put(nextRoom.toJson())
        }

        json.put(KEY_ROOMS, updatedRooms)
        jsonFileStore.write(json)

        return completedRoom
    }

    private fun ChatRoom.toJson(): JSONObject =
        JSONObject()
            .put(KEY_CHAT_ROOM_ID, chatRoomId)
            .put(KEY_RENTAL_ID, rentalId)
            .put(KEY_STATUS, status.name)

    private fun ChatMessage.toJson(): JSONObject =
        JSONObject()
            .put(KEY_MESSAGE_ID, messageId)
            .put(KEY_CHAT_ROOM_ID, chatRoomId)
            .put(KEY_SENDER_TYPE, senderType.name)
            .put(KEY_TEXT, text)
            .put(KEY_CREATED_AT_MILLIS, createdAtMillis)

    private fun JSONArray.toChatRooms(): List<ChatRoom> =
        (0 until length()).map { index ->
            val item = getJSONObject(index)
            ChatRoom(
                chatRoomId = item.getString(KEY_CHAT_ROOM_ID),
                rentalId = item.getString(KEY_RENTAL_ID),
                status = item.optString(KEY_STATUS)
                    .toChatRoomStatus()
            )
        }

    private fun JSONArray.toChatMessages(): List<ChatMessage> =
        (0 until length()).map { index ->
            val item = getJSONObject(index)
            ChatMessage(
                messageId = item.getString(KEY_MESSAGE_ID),
                chatRoomId = item.getString(KEY_CHAT_ROOM_ID),
                senderType = item.optString(KEY_SENDER_TYPE).toSenderType(),
                text = item.getString(KEY_TEXT),
                createdAtMillis = item.getLong(KEY_CREATED_AT_MILLIS)
            )
        }

    private fun String.toChatRoomStatus(): ChatRoomStatus =
        runCatching { ChatRoomStatus.valueOf(this) }
            .getOrDefault(ChatRoomStatus.REQUESTING)

    private fun String.toSenderType(): SenderType =
        runCatching { SenderType.valueOf(this) }
            .getOrDefault(SenderType.ME)

    private fun createChatRoomId(rentalId: String): String = "chat-$rentalId"

    private companion object {
        const val CHAT_DB_FILE_NAME = "chat_db.json"
        const val KEY_ROOMS = "rooms"
        const val KEY_MESSAGES = "messages"
        const val KEY_CHAT_ROOM_ID = "chatRoomId"
        const val KEY_RENTAL_ID = "rentalId"
        const val KEY_STATUS = "status"
        const val KEY_MESSAGE_ID = "messageId"
        const val KEY_SENDER_TYPE = "senderType"
        const val KEY_TEXT = "text"
        const val KEY_CREATED_AT_MILLIS = "createdAtMillis"

        fun createDefaultJson(): JSONObject =
            JSONObject()
                .put(KEY_ROOMS, JSONArray())
                .put(KEY_MESSAGES, JSONArray())
    }
}
