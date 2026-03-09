package com.pocketpdfs.backend.security.auth.login;

import com.pocketpdfs.backend.security.TestSecurityConfiguration;
import com.pocketpdfs.backend.security.auth.JwtProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LoginController.class)
@Import(TestSecurityConfiguration.class)
class LoginControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LoginUseCase loginUseCase;

    @MockitoBean
    private JwtProvider jwtProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String LOGIN_URL = "/auth/login";
    private static final String TOKEN = "generated.jwt.token";
    private static final String USERNAME = "admin";
    private static final Instant EXPIRATION = Instant.now().plusSeconds(3600);

    @Test
    @DisplayName("POST /auth/login should return 200 and LoginResponse on valid credentials")
    void testLoginWithValidRequestShouldReturn200() throws Exception {
        LoginRequest request = new LoginRequest(USERNAME, "validpassword123");
        LoginResponse response = new LoginResponse(TOKEN, USERNAME, EXPIRATION);

        when(loginUseCase.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value(TOKEN))
                .andExpect(jsonPath("$.username").value(USERNAME))
                .andExpect(jsonPath("$.expiresAt").isNotEmpty());
    }

    @Test
    @DisplayName("POST /auth/login should return 401 on bad credentials")
    void testLoginWithBadCredentialsShouldReturn401() throws Exception {
        LoginRequest request = new LoginRequest(USERNAME, "wrongpassword");

        when(loginUseCase.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid username or password"));

        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @ParameterizedTest(name = "POST /auth/login should return 400 for invalid request: [{0}]")
    @MethodSource("invalidRequestProvider")
    void testLoginWithInvalidRequestShouldReturn400(String username, String password) throws Exception {
        LoginRequest request = new LoginRequest(username, password);

        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    static Stream<Arguments> invalidRequestProvider() {
        return Stream.of(
                Arguments.of(null, "validpassword123"),
                Arguments.of("", "validpassword123"),
                Arguments.of("  ", "validpassword123"),
                Arguments.of(USERNAME, null),
                Arguments.of(USERNAME, ""),
                Arguments.of(USERNAME, "  ")
        );
    }

    @Test
    @DisplayName("POST /auth/login should return 400 when body is missing")
    void testLoginWithMissingBodyShouldReturn400() throws Exception {
        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /auth/login should return 415 when content type is not JSON")
    void testLoginWithWrongContentTypeShouldReturn415() throws Exception {
        mockMvc.perform(post(LOGIN_URL)
                        .contentType(MediaType.TEXT_PLAIN)
                        .content("admin:password"))
                .andExpect(status().isUnsupportedMediaType());
    }
}