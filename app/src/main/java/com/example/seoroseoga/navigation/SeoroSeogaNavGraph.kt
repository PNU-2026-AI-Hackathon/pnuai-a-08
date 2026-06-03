package com.example.seoroseoga.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.seoroseoga.data.repository.BorrowedBookRepository
import com.example.seoroseoga.data.repository.BookRepository
import com.example.seoroseoga.data.repository.ChatRepository
import com.example.seoroseoga.data.repository.MyBookRepository
import com.example.seoroseoga.data.repository.ReadingLogRepository
import com.example.seoroseoga.data.repository.RentalRepository
import com.example.seoroseoga.data.model.ReadingBookSource
import com.example.seoroseoga.ui.screen.bookadd.AddBookScreen
import com.example.seoroseoga.ui.screen.chat.ChatScreen
import com.example.seoroseoga.ui.screen.home.HomeScreen
import com.example.seoroseoga.ui.screen.mypage.MyPageScreen
import com.example.seoroseoga.ui.screen.mypage.MyPageTab
import com.example.seoroseoga.ui.screen.readinglog.ReadingLogScreen
import com.example.seoroseoga.ui.screen.rentaldetail.RentalDetailScreen

@Composable
fun SeoroSeogaNavGraph(
    bookRepository: BookRepository,
    rentalRepository: RentalRepository,
    chatRepository: ChatRepository,
    borrowedBookRepository: BorrowedBookRepository,
    myBookRepository: MyBookRepository,
    readingLogRepository: ReadingLogRepository
) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = Routes.HOME
    ) {
        composable(Routes.HOME) { // 홈화면 속 모든 위젯들이 trigger 하는 동작들에 대해 정의
            HomeScreen(
                rentalBooks = rentalRepository.getRentalBooks(),
                aiRecommendedBooks = bookRepository.getAiRecommendedBooks(),
                onRentalMoreClick = {
                    // TODO: 대여 가능 책 전체보기 화면 이동 (추후 구현)
                },
                onBookRegisterClick = {
                    // TODO: 책 등록 페이지 이동 (추후 구현)
                },
                onRentalBookClick = { rentalBook ->
                    navController.navigate(Routes.rentalDetail(rentalBook.rentalId))
                },
                onAiMoreClick = {
                    // TODO: AI 추천 전체보기 화면 이동 (추후 구현)
                },
                onAiBookClick = {
                    // TODO: AI 독서 가이드 페이지 이동 (추후 구현)
                },
                onHomeClick = {
                    // 현재 홈 화면
                },
                onSearchClick = {
                    // TODO: 검색 화면 이동 (추후 구현)
                },
                onMyPageClick = {
                    navController.navigate(Routes.myPage())
                }
            )
        }

        composable(
            // navController.navigate(Routes.rentalDetail(rentalBook.rentalId)) 에 의해
            // Routes.rentalDetail(rentalBook.rentalId)의 결과물인
            // "$RENTAL_DETAIL/$rentalId" 라는 문자열을 들고 navigate 를 시작
            // $RENTAL_DETAIL/$rentalId 라는 형태가 맞아서 , 대출 상세 페이지로 이동 , 그때의 navArgument 는 RENTAL_ID
            route = Routes.RENTAL_DETAIL_ROUTE,
            arguments = listOf(
                navArgument(Routes.RENTAL_ID) {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val rentalId = backStackEntry.arguments?.getString(Routes.RENTAL_ID)

            RentalDetailScreen(
                rentalBook = rentalId?.let(rentalRepository::getRentalBookById),
                onBackClick = {
                    navController.popBackStack()
                },
                onRequestRentalClick = { rentalBook ->
                    val chatRoom = chatRepository.getOrCreateChatRoom(rentalBook.rentalId)
                    navController.navigate(Routes.chat(chatRoom.chatRoomId))
                }
            )
        }

        composable(
            route = Routes.CHAT_ROUTE,
            arguments = listOf(
                navArgument(Routes.CHAT_ROOM_ID) {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val chatRoomId = backStackEntry.arguments?.getString(Routes.CHAT_ROOM_ID)
            val chatRoom = chatRoomId?.let(chatRepository::getChatRoom)
            val rentalBook = chatRoom?.let {
                rentalRepository.getRentalBookById(it.rentalId)
            }

            ChatScreen(
                rentalBook = rentalBook,
                initialMessages = chatRoomId?.let(chatRepository::getMessages).orEmpty(),
                onBackClick = {
                    navController.popBackStack()
                },
                onSendMessage = { message ->
                    chatRepository.sendMessage(
                        chatRoomId = requireNotNull(chatRoomId),
                        text = message
                    )
                },
                onCompleteAgreement = {
                    if (chatRoomId != null && rentalBook != null) {
                        chatRepository.completeAgreement(chatRoomId)
                        borrowedBookRepository.addBorrowedBook(rentalBook)
                    }
                }
            )
        }

        composable(
            route = Routes.MY_PAGE_ROUTE,
            arguments = listOf(
                navArgument(Routes.MY_PAGE_TAB) {
                    type = NavType.StringType
                    defaultValue = Routes.MY_PAGE_TAB_BORROWED
                }
            )
        ) { backStackEntry ->
            val tab = backStackEntry.arguments?.getString(Routes.MY_PAGE_TAB)
            val initialTab = if (tab == Routes.MY_PAGE_TAB_MY_BOOKS) {
                MyPageTab.MY_BOOKS
            } else {
                MyPageTab.BORROWED
            }

            MyPageScreen(
                borrowedBooks = borrowedBookRepository.getBorrowedBooks(),
                myBooks = myBookRepository.getMyBooks(),
                initialTab = initialTab,
                onAddBookClick = {
                    navController.navigate(Routes.ADD_BOOK)
                },
                onBorrowedBookClick = { borrowedBook ->
                    navController.navigate(
                        Routes.readingLog(
                            source = ReadingBookSource.BORROWED.name,
                            bookId = borrowedBook.borrowedId
                        )
                    )
                },
                onMyBookClick = { myBook ->
                    navController.navigate(
                        Routes.readingLog(
                            source = ReadingBookSource.MY_BOOK.name,
                            bookId = myBook.myBookId
                        )
                    )
                },
                onHomeClick = {
                    navController.navigate(Routes.HOME) {
                        launchSingleTop = true
                    }
                },
                onSearchClick = {
                    // TODO: 검색 화면 이동 (추후 구현)
                },
                onMyPageClick = {
                    // 현재 마이페이지
                }
            )
        }

        composable(Routes.ADD_BOOK) {
            AddBookScreen(
                onBackClick = {
                    navController.popBackStack()
                },
                onSaveClick = { title, author, publisher, coverImageUri ->
                    myBookRepository.addMyBook(
                        title = title,
                        author = author,
                        publisher = publisher,
                        coverImageUri = coverImageUri
                    )
                    navController.navigate(Routes.myPage(Routes.MY_PAGE_TAB_MY_BOOKS)) {
                        popUpTo(Routes.HOME)
                        launchSingleTop = true
                    }
                }
            )
        }

        composable(
            route = Routes.READING_LOG_ROUTE,
            arguments = listOf(
                navArgument(Routes.READING_SOURCE) {
                    type = NavType.StringType
                },
                navArgument(Routes.READING_BOOK_ID) {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val source = backStackEntry.arguments
                ?.getString(Routes.READING_SOURCE)
                ?.let { runCatching { ReadingBookSource.valueOf(it) }.getOrNull() }
            val bookId = backStackEntry.arguments?.getString(Routes.READING_BOOK_ID)

            val readingLog = when (source) {
                ReadingBookSource.BORROWED -> {
                    val borrowedBook = bookId?.let(borrowedBookRepository::getBorrowedBookById)
                    borrowedBook?.let {
                        readingLogRepository.getOrCreateReadingLog(
                            source = ReadingBookSource.BORROWED,
                            bookId = it.borrowedId,
                            title = it.rentalBook.book.title,
                            author = it.rentalBook.book.author,
                            coverImageUri = null,
                            coverImageRes = it.rentalBook.book.imageRes
                        )
                    }
                }

                ReadingBookSource.MY_BOOK -> {
                    val myBook = bookId?.let(myBookRepository::getMyBookById)
                    myBook?.let {
                        readingLogRepository.getOrCreateReadingLog(
                            source = ReadingBookSource.MY_BOOK,
                            bookId = it.myBookId,
                            title = it.title,
                            author = it.author,
                            coverImageUri = it.coverImageUri,
                            coverImageRes = null
                        )
                    }
                }

                null -> null
            }

            ReadingLogScreen(
                readingLog = readingLog,
                comments = readingLogRepository.getMockComments(),
                onBackClick = {
                    navController.popBackStack()
                },
                onSavePage = { currentPage, totalPage ->
                    if (source != null && bookId != null) {
                        readingLogRepository.updatePage(
                            source = source,
                            bookId = bookId,
                            currentPage = currentPage,
                            totalPage = totalPage
                        )
                    } else {
                        null
                    }
                },
                onSaveQuote = { quote ->
                    if (source != null && bookId != null) {
                        readingLogRepository.updateQuote(
                            source = source,
                            bookId = bookId,
                            quote = quote
                        )
                    } else {
                        null
                    }
                },
                onSaveReview = { review ->
                    if (source != null && bookId != null) {
                        readingLogRepository.updateReview(
                            source = source,
                            bookId = bookId,
                            review = review
                        )
                    } else {
                        null
                    }
                }
            )
        }
    }
}
