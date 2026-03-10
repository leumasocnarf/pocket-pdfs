package com.pocketpdfs.backend.pdfs.delete;

import com.pocketpdfs.backend.pdfs.IPdfFilesRepository;
import com.pocketpdfs.backend.pdfs.PdfFile;
import com.pocketpdfs.backend.pdfs.shared.ResourceNotFoundException;
import com.pocketpdfs.backend.s3.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeleteFileUseCase {

    private final IPdfFilesRepository repository;
    private final StorageService storageService;

    @Transactional
    public void deleteFile(UUID id) {
        PdfFile file = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));

        storageService.deleteFile(file.getS3Key());
        repository.delete(file);

        log.info("Deleted file: id={}, filename={}", id, file.getFilename());
    }
}
