package com.example.seoroseoga.sh.model

import com.google.firebase.Timestamp

data class BookInfo(
    val bookTitle: String = "",
    val bookAuthor: String = "",
    val publisher: String = "",
    val pageCount: Int? = null,
    val bookImageUrl: String? = null,
    val bookImageLocalUri: String? = null,
    val bookDescription: String? = null,
    val bookIsbn: String? = null
)

data class Meeting(
    val meetingId: String = "",
    val title: String = "",
    val description: String = "",
    val bookTitle: String = "",
    val bookAuthor: String = "",
    val bookImageUrl: String? = null,
    val bookImageLocalUri: String? = null,
    val bookDescription: String? = null,
    val bookIsbn: String? = null,
    val hostId: String = "",
    val hostName: String = "",
    val place: String = "",
    val placeAddress: String = "",
    val placeLatitude: Double? = null,
    val placeLongitude: Double? = null,
    val meetingDate: String = "",
    val meetingTime: String = "",
    val fee: Int = 0,
    val maxParticipants: Int = 2,
    val participantIds: List<String> = emptyList(),
    val currentParticipantsCount: Int = 0,
    val chatRoomId: String = "",
    val status: String = "open",
    val createdAt: Timestamp? = null,
    val updatedAt: Timestamp? = null
)

data class MeetingChatRoom(
    val chatRoomId: String = "",
    val meetingId: String = "",
    val memberIds: List<String> = emptyList(),
    val lastMessage: String = "",
    val lastMessageAt: Timestamp? = null,
    val createdAt: Timestamp? = null
)

data class MeetingMessage(
    val messageId: String = "",
    val senderId: String = "",
    val senderName: String = "",
    val text: String = "",
    val createdAt: Timestamp? = null
)

data class AIGuide(
    val id: String,
    val title: String,
    val author: String,
    val imageRes: Int,
    val matchRate: Int,
    val reason: String,
    val tags: List<String>,
    val readingTime: String,
    val backgroundKnowledge: List<String>,
    val keywords: List<String>,
    val bookQuestions: List<String>,
    val discussionTopics: List<String>,
    val aiPrompts: List<String>
)

data class AiChatMessage(
    val text: String,
    val isUser: Boolean
)

data class KakaoPlace(
    val id: String,
    val name: String,
    val address: String,
    val phone: String,
    val latitude: Double,
    val longitude: Double
)

data class MyBook(
    val myBookId: String,
    val title: String,
    val author: String,
    val publisher: String = "",
    val coverImageUri: String? = null,
    val coverImageRes: Int? = null,
    val bookImageUrl: String? = null,
    val description: String? = null,
    val isbn: String? = null,
    val totalPage: Int = 300,
    val addedAtMillis: Long
)

enum class ReadingBookSource { MY_BOOK }

data class ReadingLog(
    val readingLogId: String,
    val source: ReadingBookSource,
    val bookId: String,
    val title: String,
    val author: String,
    val coverImageUri: String? = null,
    val currentPage: Int = 0,
    val totalPage: Int = 300,
    val quote: String = "",
    val review: String = "",
    val updatedAtMillis: Long
)

data class ReadingComment(
    val commenterName: String,
    val text: String,
    val likeCount: Int
)
