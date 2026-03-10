package com.pocketpdfs.backend.pdfs.shared;

import com.pocketpdfs.backend.common.BackendApplicationException;
import org.springframework.http.HttpStatus;

import java.util.UUID;

public class ResourceNotFoundException extends BackendApplicationException {

    public ResourceNotFoundException(UUID id) {
        super(HttpStatus.NOT_FOUND, "File not found: " + id);
    }
}
