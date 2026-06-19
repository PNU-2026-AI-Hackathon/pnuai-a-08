package com.example.seoroseoga.sh.data

import com.example.seoroseoga.BuildConfig
import com.example.seoroseoga.sh.model.AIGuide
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class GeminiChatModule(
    private val apiKey: String = BuildConfig.GEMINI_API_KEY,
    private val model: String = BuildConfig.GEMINI_MODEL
) {
    suspend fun sendMessage(guide: AIGuide, question: String): String = withContext(Dispatchers.IO) {
        if (apiKey.isBlank()) {
            throw IllegalStateException("Gemini API 키가 설정되지 않았습니다. local.properties에 GEMINI_API_KEY를 추가하세요.")
        }
        if (question.isBlank()) return@withContext ""

        val requestBody = JSONObject()
            .put(
                "systemInstruction",
                JSONObject().put(
                    "parts",
                    JSONArray().put(
                        JSONObject().put(
                            "text",
                            "너는 독서 도우미 챗봇이다. 사용자가 '${guide.title}'(${guide.author})에 대해 질문하면 한국어로 쉽고 구체적으로 답한다. 책 내용, 배경지식, 토론 질문, 실천 방법을 중심으로 답하되 모르는 사실은 단정하지 않는다."
                        )
                    )
                )
            )
            .put(
                "contents",
                JSONArray().put(
                    JSONObject()
                        .put("role", "user")
                        .put(
                            "parts",
                            JSONArray().put(
                                JSONObject().put(
                                    "text",
                                    buildPrompt(guide, question)
                                )
                            )
                        )
                )
            )

        val connection = (URL("https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent").openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            connectTimeout = 15_000
            readTimeout = 30_000
            doOutput = true
            setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("x-goog-api-key", apiKey)
        }

        connection.outputStream.use { output ->
            output.write(requestBody.toString().toByteArray(Charsets.UTF_8))
        }

        val responseCode = connection.responseCode
        val stream = if (responseCode in 200..299) connection.inputStream else connection.errorStream
        val json = stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        if (responseCode !in 200..299) {
            throw IllegalStateException("Gemini API 오류 HTTP $responseCode: ${json.take(220)}")
        }

        parseAnswer(json).ifBlank {
            "응답을 받았지만 표시할 답변이 없습니다. 질문을 조금 더 구체적으로 입력해 주세요."
        }
    }

    private fun buildPrompt(guide: AIGuide, question: String): String {
        return """
            책 제목: ${guide.title}
            저자: ${guide.author}
            추천 이유: ${guide.reason}
            배경지식: ${guide.backgroundKnowledge.joinToString(", ")}
            키워드: ${guide.keywords.joinToString(", ")}
            기존 질문: ${guide.bookQuestions.joinToString(", ")}
            토론 주제: ${guide.discussionTopics.joinToString(", ")}
            사용자 질문: $question
        """.trimIndent()
    }

    private fun parseAnswer(json: String): String {
        val root = JSONObject(json)
        val candidates = root.optJSONArray("candidates") ?: return ""
        val content = candidates.optJSONObject(0)?.optJSONObject("content") ?: return ""
        val parts = content.optJSONArray("parts") ?: return ""
        return buildString {
            for (index in 0 until parts.length()) {
                val text = parts.optJSONObject(index)?.optString("text").orEmpty()
                if (text.isNotBlank()) append(text)
            }
        }.trim()
    }
}
