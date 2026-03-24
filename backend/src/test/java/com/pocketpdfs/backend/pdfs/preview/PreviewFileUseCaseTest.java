package com.pocketpdfs.backend.pdfs.preview;

import com.pocketpdfs.backend.pdfs.IPdfFilesRepository;
import com.pocketpdfs.backend.pdfs.PdfFile;
import com.pocketpdfs.backend.pdfs.shared.ResourceNotFoundException;
import com.pocketpdfs.backend.pdfs.shared.UrlResponse;
import com.pocketpdfs.backend.s3.StorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PreviewFileUseCaseTest {

    @Mock
    private IPdfFilesRepository repository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private PreviewFileUseCase previewFileUseCase;

    @Test
    void previewFileShouldReturnUrlResponseWhenFileExists() {
        UUID id = UUID.randomUUID();
        PdfFile file = PdfFile.builder()
                .id(id)
                .filename("test.pdf")
                .s3Key("stub/test.pdf")
                .size(1024L)
                .contentType("application/pdf")
                .uploadedAt(Instant.now())
                .build();

        when(repository.findById(id)).thenReturn(Optional.of(file));
        when(storageService.generatePresignedUrl(eq("stub/test.pdf"), any(Duration.class)))
                .thenReturn("http://localhost/stub/test.pdf?expires=900s");

        UrlResponse response = previewFileUseCase.previewFile(id);

        assertNotNull(response);
        assertEquals(id, response.id());
        assertEquals("test.pdf", response.filename());
        assertEquals("http://localhost/stub/test.pdf?expires=900s", response.url());
    }

    @Test
    void previewFileShouldThrowResourceNotFoundExceptionWhenFileDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> previewFileUseCase.previewFile(id));
        verifyNoInteractions(storageService);
    }
}