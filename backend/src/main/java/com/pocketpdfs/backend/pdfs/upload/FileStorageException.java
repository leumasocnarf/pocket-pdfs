package com.pocketpdfs.backend.pdfs.upload;

import com.pocketpdfs.backend.common.BackendApplicationException;
import org.springframework.http.HttpStatus;

public class FileStorageException extends BackendApplicationException {

    public FileStorageException(String message, Throwable cause) {
        super(HttpStatus.BAD_GATEWAY, message, cause);
    }
}
