package com.example.seoroseoga.sh.data

import com.example.seoroseoga.sh.UserPrefs
import com.example.seoroseoga.sh.model.Meeting
import com.example.seoroseoga.sh.model.MeetingChatRoom
import com.example.seoroseoga.sh.model.MeetingMessage
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ListenerRegistration
import com.google.firebase.firestore.Query
import kotlinx.coroutines.tasks.await

class MeetingRepository(
    private val db: FirebaseFirestore = FirebaseFirestore.getInstance(),
    private val userPrefs: UserPrefs
) {
    private val meetings = db.collection("meetings")
    private val chatRooms = db.collection("chatRooms")

    fun listenWeeklyMeetings(onChanged: (List<Meeting>) -> Unit, onError: (Throwable) -> Unit): ListenerRegistration =
        meetings
            .whereEqualTo("status", "open")
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    onError(error)
                    return@addSnapshotListener
                }
                onChanged(
                    snapshot?.documents.orEmpty()
                        .filterNot { it.metadata.hasPendingWrites() }
                        .mapNotNull { it.toObject(Meeting::class.java) }
                        .distinctBy { it.meetingId }
                        .sortedByDescending { it.createdAt?.toDate()?.time ?: 0L }
                )
            }

    fun listenMyJoinedMeetings(onChanged: (List<Meeting>) -> Unit, onError: (Throwable) -> Unit): ListenerRegistration =
        meetings
            .whereArrayContains("participantIds", userPrefs.getOrCreateUserId())
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    onError(error)
                    return@addSnapshotListener
                }
                onChanged(
                    snapshot?.documents.orEmpty()
                        .filterNot { it.metadata.hasPendingWrites() }
                        .mapNotNull { it.toObject(Meeting::class.java) }
                        .distinctBy { it.meetingId }
                        .sortedByDescending { it.createdAt?.toDate()?.time ?: 0L }
                )
            }

    suspend fun getMeetingDetail(meetingId: String): Meeting? =
        meetings.document(meetingId).get().await().toObject(Meeting::class.java)

    suspend fun getChatRoom(chatRoomId: String): MeetingChatRoom? =
        chatRooms.document(chatRoomId).get().await().toObject(MeetingChatRoom::class.java)

    suspend fun createMeeting(input: MeetingCreateInput): String {
        val hostId = userPrefs.getOrCreateUserId()
        userPrefs.saveDisplayName(input.hostName)

        val meetingRef = meetings.document()
        val chatRoomRef = chatRooms.document()
        val meetingId = meetingRef.id
        val chatRoomId = chatRoomRef.id

        val meeting = hashMapOf(
            "meetingId" to meetingId,
            "title" to input.title,
            "description" to input.description,
            "bookTitle" to input.bookTitle,
            "bookAuthor" to input.bookAuthor,
            "bookImageUrl" to input.bookImageUrl,
            "bookImageLocalUri" to input.bookImageLocalUri,
            "bookDescription" to input.bookDescription,
            "bookIsbn" to input.bookIsbn,
            "hostId" to hostId,
            "hostName" to input.hostName,
            "place" to input.place,
            "meetingDate" to input.meetingDate,
            "meetingTime" to input.meetingTime,
            "fee" to input.fee,
            "maxParticipants" to input.maxParticipants,
            "participantIds" to listOf(hostId),
            "currentParticipantsCount" to 1,
            "chatRoomId" to chatRoomId,
            "status" to "open",
            "createdAt" to FieldValue.serverTimestamp(),
            "updatedAt" to FieldValue.serverTimestamp()
        )
        val chatRoom = hashMapOf(
            "chatRoomId" to chatRoomId,
            "meetingId" to meetingId,
            "memberIds" to listOf(hostId),
            "lastMessage" to "",
            "lastMessageAt" to null,
            "createdAt" to FieldValue.serverTimestamp()
        )

        db.runBatch { batch ->
            batch.set(meetingRef, meeting)
            batch.set(chatRoomRef, chatRoom)
        }.await()

        return meetingId
    }

    suspend fun joinMeeting(meetingId: String, displayName: String): Meeting? {
        val userId = userPrefs.getOrCreateUserId()
        userPrefs.saveDisplayName(displayName)

        val meetingRef = meetings.document(meetingId)
        var joinedMeeting: Meeting? = null

        db.runTransaction { transaction ->
            val snapshot = transaction.get(meetingRef)
            val meeting = snapshot.toObject(Meeting::class.java) ?: return@runTransaction null
            joinedMeeting = meeting
            if (meeting.participantIds.contains(userId)) return@runTransaction meeting

            val nextCount = meeting.currentParticipantsCount + 1
            val nextStatus = if (nextCount >= meeting.maxParticipants) "full" else "open"
            transaction.update(
                meetingRef,
                mapOf(
                    "participantIds" to FieldValue.arrayUnion(userId),
                    "currentParticipantsCount" to nextCount,
                    "status" to nextStatus,
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            )
            if (meeting.chatRoomId.isNotBlank()) {
                transaction.update(chatRooms.document(meeting.chatRoomId), "memberIds", FieldValue.arrayUnion(userId))
            }
            meeting.copy(
                participantIds = meeting.participantIds + userId,
                currentParticipantsCount = nextCount,
                status = nextStatus
            )
        }.await()

        return getMeetingDetail(meetingId) ?: joinedMeeting
    }

    fun listenMessages(chatRoomId: String, onChanged: (List<MeetingMessage>) -> Unit, onError: (Throwable) -> Unit): ListenerRegistration =
        chatRooms.document(chatRoomId)
            .collection("messages")
            .orderBy("createdAt", Query.Direction.ASCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    onError(error)
                    return@addSnapshotListener
                }
                onChanged(snapshot?.documents.orEmpty().mapNotNull { document ->
                    document.toObject(MeetingMessage::class.java)?.copy(messageId = document.id)
                })
            }

    suspend fun sendMessage(chatRoomId: String, text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return
        val senderName = userPrefs.getDisplayName().ifBlank { "익명" }
        val messageRef = chatRooms.document(chatRoomId).collection("messages").document()
        val payload = hashMapOf(
            "messageId" to messageRef.id,
            "senderId" to userPrefs.getOrCreateUserId(),
            "senderName" to senderName,
            "text" to trimmed,
            "createdAt" to FieldValue.serverTimestamp()
        )
        db.runBatch { batch ->
            batch.set(messageRef, payload)
            batch.update(
                chatRooms.document(chatRoomId),
                mapOf(
                    "lastMessage" to trimmed,
                    "lastMessageAt" to FieldValue.serverTimestamp()
                )
            )
        }.await()
    }
}

data class MeetingCreateInput(
    val title: String,
    val description: String,
    val hostName: String,
    val place: String,
    val meetingDate: String,
    val meetingTime: String,
    val fee: Int,
    val maxParticipants: Int,
    val bookTitle: String,
    val bookAuthor: String,
    val bookImageUrl: String?,
    val bookImageLocalUri: String?,
    val bookDescription: String?,
    val bookIsbn: String?
)



