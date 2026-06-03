package com.example.seoroseoga

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import com.example.seoroseoga.data.local.BorrowedBookLocalDataSource
import com.example.seoroseoga.data.local.ChatLocalDataSource
import com.example.seoroseoga.data.local.MyBookLocalDataSource
import com.example.seoroseoga.data.local.ReadingLogLocalDataSource
import com.example.seoroseoga.data.repository.BorrowedBookRepository
import com.example.seoroseoga.data.repository.BookRepository
import com.example.seoroseoga.data.repository.ChatRepository
import com.example.seoroseoga.data.repository.MyBookRepository
import com.example.seoroseoga.data.repository.ReadingLogRepository
import com.example.seoroseoga.data.repository.RentalRepository
import com.example.seoroseoga.navigation.SeoroSeogaNavGraph

class MainActivity : ComponentActivity() {
    private val bookRepository = BookRepository()
    private val rentalRepository = RentalRepository()
    private val chatRepository by lazy {
        ChatRepository(
            localDataSource = ChatLocalDataSource(this)
        )
    }
    private val borrowedBookRepository by lazy {
        BorrowedBookRepository(
            localDataSource = BorrowedBookLocalDataSource(this)
        )
    }
    private val myBookRepository by lazy {
        MyBookRepository(
            localDataSource = MyBookLocalDataSource(this)
        )
    }
    private val readingLogRepository by lazy {
        ReadingLogRepository(
            localDataSource = ReadingLogLocalDataSource(this)
        )
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SeoroSeogaApp(
                bookRepository = bookRepository,
                rentalRepository = rentalRepository,
                chatRepository = chatRepository,
                borrowedBookRepository = borrowedBookRepository,
                myBookRepository = myBookRepository,
                readingLogRepository = readingLogRepository
            )
        }
    }
}

@Composable
fun SeoroSeogaApp(
    bookRepository: BookRepository,
    rentalRepository: RentalRepository,
    chatRepository: ChatRepository,
    borrowedBookRepository: BorrowedBookRepository,
    myBookRepository: MyBookRepository,
    readingLogRepository: ReadingLogRepository
) {
    MaterialTheme {
        SeoroSeogaNavGraph( // 여기 들어가면 이제 home 화면에서 시작되는 모든 다음 흐름을 정의해 놓았음.
            bookRepository = bookRepository,
            rentalRepository = rentalRepository,
            chatRepository = chatRepository,
            borrowedBookRepository = borrowedBookRepository,
            myBookRepository = myBookRepository,
            readingLogRepository = readingLogRepository
        )
    }
}
