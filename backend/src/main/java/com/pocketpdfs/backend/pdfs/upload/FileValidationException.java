package com.pocketpdfs.backend.pdfs.upload;

import com.pocketpdfs.backend.common.BackendApplicationException;
import org.springframework.http.HttpStatus;

public class FileValidationException extends BackendApplicationException {

    public FileValidationException(String message) {
        super(HttpStatus.BAD_REQUEST, message);
    }
}
