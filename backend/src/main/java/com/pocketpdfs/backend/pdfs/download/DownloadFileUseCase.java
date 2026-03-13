package com.pocketpdfs.backend.pdfs.download;

import com.pocketpdfs.backend.pdfs.IPdfFilesRepository;
import com.pocketpdfs.backend.pdfs.PdfFile;
import com.pocketpdfs.backend.pdfs.shared.ResourceNotFoundException;
import com.pocketpdfs.backend.pdfs.shared.UrlResponse;
import com.pocketpdfs.backend.s3.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DownloadFileUseCase {

    private static final Duration DOWNLOAD_URL_EXPIRY = Duration.ofMinutes(5);

    private final IPdfFilesRepository repository;
    private final StorageService storageService;

    public UrlResponse downloadFile(UUID id) {
        PdfFile file = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        String url = storageService.generatePresignedUrl(file.getS3Key(), DOWNLOAD_URL_EXPIRY);
        log.info("Generated download URL: id={}, filename={}", id, file.getFilename());
        return UrlResponse.from(file, url);
    }
}
