package com.pocketpdfs.backend.security.auth.login;

import com.pocketpdfs.backend.security.auth.JwtProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.util.Objects;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginUseCaseTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtProvider jwtProvider;

    @InjectMocks
    private LoginUseCase loginUseCase;

    private static final String USERNAME = "admin";
    private static final String PASSWORD = "password";
    private static final String TOKEN = "generated.jwt.token";
    private static final Instant EXPIRATION = Instant.now().plusSeconds(3600);

    @Test
    @DisplayName("login should return a valid LoginResponseDTO on success")
    void testLoginWithValidCredentialsShouldReturnResponse() {
        LoginRequest request = new LoginRequest(USERNAME, PASSWORD);

        Authentication authentication = new UsernamePasswordAuthenticationToken(USERNAME, PASSWORD);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtProvider.generateToken(USERNAME)).thenReturn(TOKEN);
        when(jwtProvider.getExpirationInstant()).thenReturn(EXPIRATION);

        LoginResponse response = loginUseCase.login(request);

        assertAll(
                () -> assertEquals(TOKEN, response.token()),
                () -> assertEquals(USERNAME, response.username()),
                () -> assertEquals(EXPIRATION, response.expiresAt())
        );
    }

    @ParameterizedTest(name = "login should throw BadCredentialsException for invalid credentials: [{0}]")
    @MethodSource("invalidCredentialsProvider")
    void testLoginWithInvalidCredentialsShouldThrowBadCredentialsException(String username, String password) {
        LoginRequest request = new LoginRequest(username, password);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        assertThrows(BadCredentialsException.class, () -> loginUseCase.login(request));
    }

    static Stream<Arguments> invalidCredentialsProvider() {
        return Stream.of(
                Arguments.of("admin", "wrongpassword"),
                Arguments.of("unknownuser", "password"),
                Arguments.of("unknownuser", "wrongpassword")
        );
    }

    @Test
    @DisplayName("login should call authenticationManager with correct credentials")
    void testLoginShouldCallAuthenticationManagerWithCorrectCredentials() {
        LoginRequest request = new LoginRequest(USERNAME, PASSWORD);
        Authentication authentication = new UsernamePasswordAuthenticationToken(USERNAME, PASSWORD);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtProvider.generateToken(USERNAME)).thenReturn(TOKEN);
        when(jwtProvider.getExpirationInstant()).thenReturn(EXPIRATION);

        loginUseCase.login(request);

        verify(authenticationManager).authenticate(
                argThat(auth ->
                        Objects.equals(auth.getPrincipal(), USERNAME) &&
                                Objects.equals(auth.getCredentials(), PASSWORD)
                )
        );
    }

    @Test
    @DisplayName("login should call generateToken with the authenticated username")
    void testLoginShouldCallGenerateTokenWithAuthenticatedUsername() {
        LoginRequest request = new LoginRequest(USERNAME, PASSWORD);
        Authentication authentication = new UsernamePasswordAuthenticationToken(USERNAME, PASSWORD);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtProvider.generateToken(USERNAME)).thenReturn(TOKEN);
        when(jwtProvider.getExpirationInstant()).thenReturn(EXPIRATION);

        loginUseCase.login(request);

        verify(jwtProvider).generateToken(USERNAME);
    }
}