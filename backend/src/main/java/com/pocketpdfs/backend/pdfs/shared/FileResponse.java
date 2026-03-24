package com.pocketpdfs.backend.pdfs.shared;

import com.pocketpdfs.backend.pdfs.PdfFile;

import java.util.UUID;

public record FileResponse(
        UUID id,
        String filename,
        Long size,
        String contentType,
        String uploadedAt
) {
    public static FileResponse from(PdfFile file) {
        return new FileResponse(
                file.getId(),
                file.getFilename(),
                file.getSize(),
                file.getContentType(),
                file.getUploadedAt().toString()
        );
    }
}
