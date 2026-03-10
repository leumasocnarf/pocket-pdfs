package com.pocketpdfs.backend.pdfs.shared;

import com.pocketpdfs.backend.pdfs.PdfFile;

import java.util.UUID;

public record UrlResponse(
        UUID id,
        String filename,
        String url
) {
    public static UrlResponse from(PdfFile file, String url) {
        return new UrlResponse(
                file.getId(),
                file.getFilename(),
                url
        );
    }
}
