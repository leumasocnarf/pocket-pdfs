package com.pocketpdfs.backend.pdfs.upload;

import com.pocketpdfs.backend.pdfs.IPdfFilesRepository;
import com.pocketpdfs.backend.pdfs.PdfFile;
import com.pocketpdfs.backend.pdfs.shared.FileResponse;
import com.pocketpdfs.backend.s3.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class UploadFileUseCase {

    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024; // 50MB
    private static final String PDF_CONTENT_TYPE = "application/pdf";

    private final IPdfFilesRepository repository;
    private final StorageService storageService;

    @Transactional
    public FileResponse uploadFile(MultipartFile file) throws IOException {
        validate(file);

        String s3Key = storageService.uploadFile(file);

        PdfFile pdfFile = PdfFile.builder()
                .filename(file.getOriginalFilename())
                .s3Key(s3Key)
                .size(file.getSize())
                .contentType(file.getContentType())
                .build();

        PdfFile saved = repository.save(pdfFile);
        log.info("Uploaded file: id={}, filename={}", saved.getId(), saved.getFilename());

        return FileResponse.from(saved);
    }

    private void validate(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileValidationException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileValidationException("File exceeds the 50MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals(PDF_CONTENT_TYPE)) {
            throw new FileValidationException("Only PDF files are allowed");
        }
    }
}
