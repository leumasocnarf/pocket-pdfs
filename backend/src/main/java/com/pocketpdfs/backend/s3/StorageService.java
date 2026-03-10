package com.pocketpdfs.backend.s3;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;

public interface StorageService {

    /**
     * Uploads a file and returns the storage key to reference it later.
     */
    String uploadFile(MultipartFile file) throws IOException;

    /**
     * Generates a pre-signed URL valid for the given duration.
     */
    String generatePresignedUrl(String key, Duration expiry);

    /**
     * Deletes a file by its storage key.
     */
    void deleteFile(String key);
}
