package com.example.seoroseoga.ui.component

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

enum class BottomNavDestination {
    HOME,
    SEARCH,
    MY_PAGE
}

@Composable
fun BottomNavigationBar(
    selectedDestination: BottomNavDestination = BottomNavDestination.HOME,
    onHomeClick: () -> Unit,
    onSearchClick: () -> Unit,
    onMyPageClick: () -> Unit
) {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 4.dp
    ) {
        NavigationBarItem(
            selected = selectedDestination == BottomNavDestination.HOME,
            onClick = onHomeClick,
            icon = {
                Icon(Icons.Filled.Home, contentDescription = "홈")
            },
            label = {
                Text("홈")
            },
            colors = NavigationBarItemDefaults.colors(
                selectedIconColor = Color(0xFF5B5CE2),
                selectedTextColor = Color(0xFF5B5CE2),
                indicatorColor = Color.Transparent
            )
        )

        NavigationBarItem(
            selected = selectedDestination == BottomNavDestination.SEARCH,
            onClick = onSearchClick,
            icon = {
                Icon(Icons.Outlined.Search, contentDescription = "검색")
            },
            label = {
                Text("검색")
            },
            colors = NavigationBarItemDefaults.colors(
                unselectedIconColor = Color(0xFF888888),
                unselectedTextColor = Color(0xFF888888),
                indicatorColor = Color.Transparent
            )
        )

        NavigationBarItem(
            selected = selectedDestination == BottomNavDestination.MY_PAGE,
            onClick = onMyPageClick,
            icon = {
                Icon(Icons.Outlined.Person, contentDescription = "마이페이지")
            },
            label = {
                Text("마이페이지")
            },
            colors = NavigationBarItemDefaults.colors(
                unselectedIconColor = Color(0xFF888888),
                unselectedTextColor = Color(0xFF888888),
                indicatorColor = Color.Transparent
            )
        )
    }
}
