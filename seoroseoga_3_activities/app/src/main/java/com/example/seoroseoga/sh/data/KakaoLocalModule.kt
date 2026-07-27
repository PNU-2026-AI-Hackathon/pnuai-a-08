package com.example.seoroseoga.sh.data

import com.example.seoroseoga.BuildConfig
import com.example.seoroseoga.sh.model.KakaoPlace
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URLEncoder
import java.net.URL

class KakaoLocalModule(
    private val restApiKey: String = BuildConfig.KAKAO_REST_API_KEY
) {
    suspend fun searchPlaces(query: String): List<KakaoPlace> = withContext(Dispatchers.IO) {
        val trimmed = query.trim()
        if (trimmed.isBlank()) return@withContext emptyList()
        if (restApiKey.isBlank()) {
            throw IllegalStateException("카카오 REST API 키가 설정되지 않았습니다. local.properties에 KAKAO_REST_API_KEY를 추가하세요.")
        }

        val encoded = URLEncoder.encode(trimmed, "UTF-8")
        val url = "https://dapi.kakao.com/v2/local/search/keyword.json?query=$encoded&size=10"
        val connection = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 10_000
            readTimeout = 10_000
            setRequestProperty("Accept", "application/json")
            setRequestProperty("Authorization", "KakaoAK $restApiKey")
        }

        val responseCode = connection.responseCode
        val stream = if (responseCode in 200..299) connection.inputStream else connection.errorStream
        val json = stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        if (responseCode !in 200..299) {
            if (responseCode == 403 && json.contains("OPEN_MAP_AND_LOCAL")) {
                throw IllegalStateException("카카오 Developers에서 카카오맵/로컬 API 사용 설정이 꺼져 있습니다. 내 애플리케이션 > 제품 설정 > 카카오맵에서 사용 상태를 ON으로 바꿔주세요.")
            }
            throw IllegalStateException("카카오 장소 검색 오류 HTTP $responseCode: ${json.take(180)}")
        }

        val documents = JSONObject(json).optJSONArray("documents") ?: return@withContext emptyList()
        buildList {
            for (index in 0 until documents.length()) {
                val item = documents.optJSONObject(index) ?: continue
                val longitude = item.optString("x").toDoubleOrNull() ?: continue
                val latitude = item.optString("y").toDoubleOrNull() ?: continue
                add(
                    KakaoPlace(
                        id = item.optString("id"),
                        name = item.optString("place_name"),
                        address = item.optString("road_address_name").ifBlank { item.optString("address_name") },
                        phone = item.optString("phone"),
                        latitude = latitude,
                        longitude = longitude
                    )
                )
            }
        }
    }
}
