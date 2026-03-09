package com.pocketpdfs.backend.security.auth.login;

import java.time.Instant;

public record LoginResponse(
        String token,
        // Maybe include tokenType = Bearer
        String username,
        Instant expiresAt
) {
}
