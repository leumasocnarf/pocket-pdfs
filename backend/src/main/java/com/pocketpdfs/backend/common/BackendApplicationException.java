package com.pocketpdfs.backend.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public abstract class BackendApplicationException extends RuntimeException {

    private final HttpStatus status;

    protected BackendApplicationException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    protected BackendApplicationException(HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.status = status;
    }
}
