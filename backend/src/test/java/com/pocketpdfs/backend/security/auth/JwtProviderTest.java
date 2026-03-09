package com.pocketpdfs.backend.security.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.Instant;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

class JwtProviderTest {

    private JwtProvider jwtProvider;

    private static final String VALID_SECRET = "test-secret-key-that-is-long-enough-for-hs256";
    private static final long EXPIRATION_MS = 3600000L; // 1 hour

    @BeforeEach
    void setUp() throws Exception {
        jwtProvider = new JwtProvider();
        setField(jwtProvider, "jwtSecret", VALID_SECRET);
        setField(jwtProvider, "jwtExpirationMs", EXPIRATION_MS);
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        var field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    @Test
    @DisplayName("validateSecret should pass with a secret >= 32 characters")
    void testValidateSecretWithValidSecretShouldNotThrow() {
        assertDoesNotThrow(() -> jwtProvider.validateSecret());
    }

    @ParameterizedTest(name = "validateSecret should throw for short secret: [{0}]")
    @MethodSource("shortSecretProvider")
    void testValidateSecretWithShortSecretShouldThrow(String shortSecret) throws Exception {
        setField(jwtProvider, "jwtSecret", shortSecret);
        assertThrows(IllegalStateException.class, () -> jwtProvider.validateSecret());
    }

    static Stream<Arguments> shortSecretProvider() {
        return Stream.of(
                Arguments.of("short"),
                Arguments.of("exactly-thirty-one-characters!!"),
                Arguments.of("")
        );
    }

    @ParameterizedTest(name = "generateToken should return non-blank token for username: [{0}]")
    @MethodSource("usernameProvider")
    void testGenerateTokenWithValidUsernameShouldReturnNonBlankToken(String username) {
        String token = jwtProvider.generateToken(username);
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    static Stream<Arguments> usernameProvider() {
        return Stream.of(
                Arguments.of("admin"),
                Arguments.of("user@example.com"),
                Arguments.of("john_doe")
        );
    }

    @ParameterizedTest(name = "extractUsername should return [{0}] from generated token")
    @MethodSource("usernameProvider")
    void testExtractUsernameWithValidTokenShouldReturnCorrectUsername(String username) {
        String token = jwtProvider.generateToken(username);
        assertEquals(username, jwtProvider.extractUsername(token));
    }

    @ParameterizedTest(name = "isTokenValid should return true for valid token with username: [{0}]")
    @MethodSource("usernameProvider")
    void testIsTokenValidWithValidTokenShouldReturnTrue(String username) {
        String token = jwtProvider.generateToken(username);
        assertTrue(jwtProvider.isTokenValid(token));
    }

    @Test
    @DisplayName("isTokenValid should return false for an expired token")
    void testIsTokenValidWithExpiredTokenShouldReturnFalse() throws Exception {
        setField(jwtProvider, "jwtExpirationMs", -1000L);
        String expiredToken = jwtProvider.generateToken("admin");
        assertFalse(jwtProvider.isTokenValid(expiredToken));
    }

    @ParameterizedTest(name = "isTokenValid should return false for malformed token: [{0}]")
    @MethodSource("malformedTokenProvider")
    void testIsTokenValidWithMalformedTokenShouldReturnFalse(String malformedToken) {
        assertFalse(jwtProvider.isTokenValid(malformedToken));
    }

    static Stream<Arguments> malformedTokenProvider() {
        return Stream.of(
                Arguments.of("not.a.jwt"),
                Arguments.of(""),
                Arguments.of("Bearer eyJhbGciOiJIUzI1NiJ9.fake.payload"),
                Arguments.of((Object) null)
        );
    }

    @Test
    @DisplayName("getExpirationInstant should return an instant approximately 1 hour from now")
    void testGetExpirationInstantShouldReturnFutureInstant() {
        Instant before = Instant.now().plusMillis(EXPIRATION_MS - 1000);
        Instant expiration = jwtProvider.getExpirationInstant();
        Instant after = Instant.now().plusMillis(EXPIRATION_MS + 1000);

        assertTrue(expiration.isAfter(before) && expiration.isBefore(after));
    }
}