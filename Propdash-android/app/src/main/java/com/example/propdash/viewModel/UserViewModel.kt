package com.example.propdash.viewModel

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.propdash.data.service.SessionManager
import com.example.propdash.data.model.ErrorResponse
import com.example.propdash.data.model.LoginRequest
import com.example.propdash.data.model.RegisterRequest
import com.example.propdash.data.model.Role
import com.example.propdash.data.model.User
import com.example.propdash.data.model.VerificationRequest
import com.example.propdash.data.repository.UserRepository
import com.google.gson.Gson
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class UserViewModel(private val sessionManager: SessionManager) : ViewModel() {
    private val userRepository = UserRepository()
    private val _errorMessage = mutableStateOf("")
    val errorMessage: State<String> = _errorMessage

    val userSession: StateFlow<User?> = sessionManager.userSession
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(), null)

    fun login(email: String, password: String) {
        viewModelScope.launch {
            try {
                val user = userRepository.login(LoginRequest(email, password))
                if (user.isSuccessful) {
                    val userResponse = user.body()
                    //get the cookie from the response headers
                    val cookie = user.headers().get("Set-Cookie")
                    if (userResponse != null) {
                        userResponse.cookie = cookie!!
                    }
                    userResponse?.let {
                        saveUserSession(
                            it.id,
                            it.name,
                            it.email,
                            it.role,
                            it.verified,
                            it.cookie
                        )
                    }
                } else {
                    val errorResponse =
                        Gson().fromJson(user.errorBody()?.string(), ErrorResponse::class.java)
                    _errorMessage.value = errorResponse.error
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message.toString()
            }
        }
    }

    fun register(name: String, email: String, phoneNumber: String, password: String, role: Role) {
        viewModelScope.launch {
            try {
                val userResponse = userRepository.register(
                    RegisterRequest(
                        name,
                        email,
                        password,
                        phoneNumber,
                        role
                    )
                )
                if (userResponse.isSuccessful) {
                    val user = userResponse.body()
                    val cookie = userResponse.headers().get("Set-Cookie")
                    user?.let {
                        saveUserSession(
                            it.id,
                            it.name,
                            it.email,
                            it.role,
                            it.verified,
                            cookie!!
                        )
                    }
                } else {
                    val errorResponse = Gson().fromJson(
                        userResponse.errorBody()?.string(),
                        ErrorResponse::class.java
                    )
                    _errorMessage.value = errorResponse.error
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message.toString()
            }
        }
    }

    fun verifyAccount(token: String) {
        viewModelScope.launch {
            try {

                val response = userRepository.verifyAccount(
                    userSession.value!!.cookie,
                    VerificationRequest(token)
                )
                if (!response.isSuccessful) {
                    val errorResponse =
                        Gson().fromJson(response.errorBody()?.string(), ErrorResponse::class.java)
                    _errorMessage.value = errorResponse.error
                } else {
                    val user = userSession.value
                    user?.let {
                        saveUserSession(
                            it.id,
                            it.name,
                            it.email,
                            it.role,
                            true,
                            it.cookie
                        )
                    }
                }
            } catch (e: Exception) {
                _errorMessage.value = e.message.toString()
            }
        }
    }

    // Save user session when login is successful
    private fun saveUserSession(
        id: String,
        name: String,
        email: String,
        role: Role,
        verified: Boolean,
        cookie: String
    ) {
        viewModelScope.launch {
            val userSession = User(id, name, email, role, verified, cookie)
            sessionManager.saveUserSession(userSession)
        }
    }

    // Clear session on logout
    fun clearSession() {
        viewModelScope.launch {
            sessionManager.clearUserSession()
        }
    }

    fun clearErrorMessage() {
        _errorMessage.value = ""
    }
}
