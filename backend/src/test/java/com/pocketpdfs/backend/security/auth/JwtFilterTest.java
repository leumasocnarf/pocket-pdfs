package com.pocketpdfs.backend.security.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.io.IOException;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtFilterTest {

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtFilter jwtFilter;

    private UserDetails userDetails;

    private static final String VALID_TOKEN = "valid.jwt.token";
    private static final String USERNAME = "admin";
    private static final String BEARER_TOKEN = "Bearer " + VALID_TOKEN;

    @BeforeEach
    void setUp() {
        userDetails = User.builder()
                .username(USERNAME)
                .password("password")
                .roles("ADMIN")
                .build();

        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @ParameterizedTest(name = "extractToken should return null for invalid header: [{0}] is invalid")
    @MethodSource("invalidAuthHeaderProvider")
    @DisplayName("extractToken should return null for invalid header")
    void testExtractTokenWithInvalidHeaderShouldReturnNull(String header) {
        when(request.getHeader("Authorization")).thenReturn(header);
        assertNull(jwtFilter.extractToken(request));
    }

    static Stream<Arguments> invalidAuthHeaderProvider() {
        return Stream.of(
                Arguments.of((Object) null),
                Arguments.of(""),
                Arguments.of("Basic somebase64credentials"),
                Arguments.of("Bearer"),
                Arguments.of("bearer " + VALID_TOKEN)
        );
    }

    @Test
    @DisplayName("extractToken should return token when Authorization header is valid")
    void testExtractTokenWithValidHeaderShouldReturnToken() {
        when(request.getHeader("Authorization")).thenReturn(BEARER_TOKEN);
        assertEquals(VALID_TOKEN, jwtFilter.extractToken(request));
    }

    @Test
    @DisplayName("Should authenticate user when token is valid")
    void testDoFilterInternalWithValidTokenShouldSetAuthentication() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(BEARER_TOKEN);
        when(jwtProvider.isTokenValid(VALID_TOKEN)).thenReturn(true);
        when(jwtProvider.extractUsername(VALID_TOKEN)).thenReturn(USERNAME);
        when(userDetailsService.loadUserByUsername(USERNAME)).thenReturn(userDetails);

        jwtFilter.doFilterInternal(request, response, filterChain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(auth);
        assertEquals(USERNAME, auth.getName());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should not authenticate when token is invalid")
    void testDoFilterInternalWithInvalidTokenShouldNotSetAuthentication() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(BEARER_TOKEN);
        when(jwtProvider.isTokenValid(VALID_TOKEN)).thenReturn(false);

        jwtFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should not authenticate when Authorization header is missing")
    void testDoFilterInternalWithNoHeaderShouldNotSetAuthentication() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(null);

        jwtFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should not overwrite existing authentication in SecurityContext")
    void testDoFilterInternalWithExistingAuthenticationShouldNotOverwrite() throws ServletException, IOException {
        UsernamePasswordAuthenticationToken existingAuth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        when(request.getHeader("Authorization")).thenReturn(BEARER_TOKEN);
        when(jwtProvider.isTokenValid(VALID_TOKEN)).thenReturn(true);

        jwtFilter.doFilterInternal(request, response, filterChain);

        verify(userDetailsService, never()).loadUserByUsername(any());
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("Should not authenticate when user is not found")
    void testDoFilterInternalWithUserNotFoundShouldNotSetAuthentication() throws ServletException, IOException {
        when(request.getHeader("Authorization")).thenReturn(BEARER_TOKEN);
        when(jwtProvider.isTokenValid(VALID_TOKEN)).thenReturn(true);
        when(jwtProvider.extractUsername(VALID_TOKEN)).thenReturn(USERNAME);
        when(userDetailsService.loadUserByUsername(USERNAME))
                .thenThrow(new UsernameNotFoundException("User not found"));

        jwtFilter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }
}