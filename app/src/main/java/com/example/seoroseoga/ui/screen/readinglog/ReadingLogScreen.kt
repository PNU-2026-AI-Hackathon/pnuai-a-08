package com.example.seoroseoga.ui.screen.readinglog

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.seoroseoga.data.model.ReadingComment
import com.example.seoroseoga.data.model.ReadingLog

@Composable
fun ReadingLogScreen(
    readingLog: ReadingLog?,
    comments: List<ReadingComment>,
    onBackClick: () -> Unit,
    onSavePage: (currentPage: Int, totalPage: Int) -> ReadingLog?,
    onSaveQuote: (quote: String) -> ReadingLog?,
    onSaveReview: (review: String) -> ReadingLog?
) {
    if (readingLog == null) {
        ReadingLogNotFound(onBackClick = onBackClick)
        return
    }

    var currentPage by remember(readingLog.readingLogId) {
        mutableIntStateOf(readingLog.currentPage)
    }
    var totalPageText by remember(readingLog.readingLogId) {
        mutableStateOf(readingLog.totalPage.toString())
    }
    var directPageText by remember(readingLog.readingLogId) {
        mutableStateOf(readingLog.currentPage.toString())
    }
    var quote by remember(readingLog.readingLogId) {
        mutableStateOf(readingLog.quote)
    }
    var review by remember(readingLog.readingLogId) {
        mutableStateOf(readingLog.review)
    }

    val totalPage = totalPageText.toIntOrNull()?.coerceAtLeast(1) ?: 1
    val progress = (currentPage.toFloat() / totalPage.toFloat()).coerceIn(0f, 1f)
    val progressPercent = (progress * 100).toInt()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(horizontal = 18.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(10.dp))

        ReadingLogHeader(
            onBackClick = onBackClick
        )

        Spacer(modifier = Modifier.height(12.dp))

        ReadingLogTabs()

        Spacer(modifier = Modifier.height(18.dp))

        ReadingProgressSection(
            currentPage = currentPage,
            totalPage = totalPage,
            progress = progress,
            progressPercent = progressPercent
        )

        Spacer(modifier = Modifier.height(18.dp))

        PageRecordSection(
            totalPageText = totalPageText,
            directPageText = directPageText,
            onMinusClick = {
                currentPage = (currentPage - 1).coerceAtLeast(0)
                directPageText = currentPage.toString()
            },
            onPlusClick = {
                currentPage = (currentPage + 1).coerceAtMost(totalPage)
                directPageText = currentPage.toString()
            },
            onTotalPageChange = { totalPageText = it.filter(Char::isDigit) },
            onDirectPageChange = { directPageText = it.filter(Char::isDigit) },
            onSaveClick = {
                val nextTotalPage = totalPageText.toIntOrNull()?.coerceAtLeast(1) ?: 1
                val nextCurrentPage = directPageText.toIntOrNull()
                    ?.coerceIn(0, nextTotalPage)
                    ?: currentPage
                onSavePage(nextCurrentPage, nextTotalPage)?.let {
                    currentPage = it.currentPage
                    totalPageText = it.totalPage.toString()
                    directPageText = it.currentPage.toString()
                }
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        TextRecordSection(
            title = "기억에 남는 문장",
            value = quote,
            placeholder = "기억에 남는 문장을 입력하세요.",
            onValueChange = { quote = it },
            onSaveClick = {
                onSaveQuote(quote)?.let {
                    quote = it.quote
                }
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        TextRecordSection(
            title = "나의 감상",
            value = review,
            placeholder = "나의 감상을 입력하세요.",
            onValueChange = { review = it },
            onSaveClick = {
                onSaveReview(review)?.let {
                    review = it.review
                }
            }
        )

        Spacer(modifier = Modifier.height(16.dp))

        TogetherSection(
            comments = comments
        )

        Spacer(modifier = Modifier.height(28.dp))
    }
}

@Composable
private fun ReadingLogHeader(
    onBackClick: () -> Unit
) {
    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        IconButton(
            onClick = onBackClick,
            modifier = Modifier.align(Alignment.CenterStart)
        ) {
            Icon(
                imageVector = Icons.Filled.ArrowBack,
                contentDescription = "뒤로가기",
                tint = Color.Black
            )
        }
        Text(
            text = "독서 기록",
            color = Color.Black,
            fontSize = 18.sp,
            fontWeight = FontWeight.Bold
        )
        Icon(
            imageVector = Icons.Outlined.Settings,
            contentDescription = "설정",
            tint = Color(0xFF555555),
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .size(24.dp)
        )
    }
}

@Composable
private fun ReadingLogTabs() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(34.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFFF4F4F0)),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .weight(1f)
                .height(30.dp)
                .padding(start = 3.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFF7B8A63)),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "기록",
                color = Color.White,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold
            )
        }
        Box(
            modifier = Modifier.weight(1f),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "커뮤니티",
                color = Color(0xFF777777),
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun ReadingProgressSection(
    currentPage: Int,
    totalPage: Int,
    progress: Float,
    progressPercent: Int
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(Color(0xFFFAFAF7))
            .padding(14.dp)
    ) {
        Text(
            text = "독서 진행률",
            color = Color.Black,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(12.dp))
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            LinearProgressIndicator(
                progress = { progress },
                color = Color(0xFF7B8A63),
                trackColor = Color(0xFFE8E8E0),
                modifier = Modifier
                    .weight(1f)
                    .height(8.dp)
                    .clip(RoundedCornerShape(10.dp))
            )
            Text(
                text = "$progressPercent%",
                color = Color(0xFF7B8A63),
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(start = 12.dp)
            )
        }
        Spacer(modifier = Modifier.height(10.dp))
        Text(
            text = "현재 페이지                         ${currentPage} / ${totalPage}p",
            color = Color(0xFF555555),
            fontSize = 13.sp
        )
        Text(
            text = "전체 분량 페이지                 ${totalPage}p",
            color = Color(0xFF555555),
            fontSize = 13.sp
        )
    }
}

@Composable
private fun PageRecordSection(
    totalPageText: String,
    directPageText: String,
    onMinusClick: () -> Unit,
    onPlusClick: () -> Unit,
    onTotalPageChange: (String) -> Unit,
    onDirectPageChange: (String) -> Unit,
    onSaveClick: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        SectionTitle("현재 페이지 기록")

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = onMinusClick,
                colors = mutedButtonColors(),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.size(44.dp)
            ) {
                Text("-")
            }
            OutlinedTextField(
                value = directPageText,
                onValueChange = onDirectPageChange,
                singleLine = true,
                textStyle = androidx.compose.ui.text.TextStyle(
                    textAlign = TextAlign.Center,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                ),
                modifier = Modifier.weight(1f)
            )
            Text(
                text = "/",
                color = Color(0xFF999999),
                fontSize = 14.sp
            )
            OutlinedTextField(
                value = totalPageText,
                onValueChange = onTotalPageChange,
                singleLine = true,
                suffix = { Text("p") },
                modifier = Modifier.weight(1f)
            )
            Button(
                onClick = onPlusClick,
                colors = mutedButtonColors(),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.size(44.dp)
            ) {
                Text("+")
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = onSaveClick,
            colors = mutedButtonColors(),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(42.dp)
        ) {
            Text("직접 입력하기")
        }

        Text(
            text = "- / + 버튼 또는 직접 입력으로 현재 페이지를 기록해보세요.",
            color = Color(0xFF999999),
            fontSize = 11.sp,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 6.dp),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
private fun TextRecordSection(
    title: String,
    value: String,
    placeholder: String,
    onValueChange: (String) -> Unit,
    onSaveClick: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        SectionTitle(title)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder) },
            minLines = 4,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            Button(
                onClick = onSaveClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF7B8A63),
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("저장하기")
            }
        }
    }
}

@Composable
private fun TogetherSection(
    comments: List<ReadingComment>
) {
    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "같이 읽는 사람들",
                color = Color.Black,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f)
            )
            Text(
                text = "더보기 >",
                color = Color(0xFF777777),
                fontSize = 12.sp
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        comments.forEach { comment ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 7.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(RoundedCornerShape(50))
                        .background(Color(0xFFEDEBFF)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = comment.commenterName.take(1),
                        color = Color(0xFF5B5CE2),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .padding(start = 10.dp)
                ) {
                    Text(
                        text = comment.commenterName,
                        color = Color.Black,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = comment.text,
                        color = Color(0xFF777777),
                        fontSize = 12.sp
                    )
                }
                Icon(
                    imageVector = Icons.Outlined.Favorite,
                    contentDescription = "좋아요",
                    tint = Color(0xFF7B8A63),
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = comment.likeCount.toString(),
                    color = Color(0xFF555555),
                    fontSize = 12.sp,
                    modifier = Modifier.padding(start = 4.dp)
                )
            }
        }
    }
}

@Composable
private fun SectionTitle(
    title: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title,
            color = Color.Black,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.weight(1f)
        )
        Icon(
            imageVector = Icons.Outlined.BookmarkBorder,
            contentDescription = null,
            tint = Color(0xFF7B8A63),
            modifier = Modifier.size(18.dp)
        )
    }
}

@Composable
private fun mutedButtonColors() =
    ButtonDefaults.buttonColors(
        containerColor = Color(0xFFF4F4F0),
        contentColor = Color(0xFF555555)
    )

@Composable
private fun ReadingLogNotFound(
    onBackClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
            .padding(18.dp)
    ) {
        IconButton(onClick = onBackClick) {
            Icon(
                imageVector = Icons.Filled.ArrowBack,
                contentDescription = "뒤로가기",
                tint = Color.Black
            )
        }
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "독서 기록을 찾을 수 없습니다.",
            color = Color(0xFF555555),
            fontSize = 15.sp
        )
    }
}
