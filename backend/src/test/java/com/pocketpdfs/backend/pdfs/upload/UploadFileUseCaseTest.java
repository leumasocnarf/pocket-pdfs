package com.pocketpdfs.backend.pdfs.upload;

import com.pocketpdfs.backend.pdfs.IPdfFilesRepository;
import com.pocketpdfs.backend.pdfs.PdfFile;
import com.pocketpdfs.backend.pdfs.shared.FileResponse;
import com.pocketpdfs.backend.s3.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UploadFileUseCaseTest {

    @Mock
    private IPdfFilesRepository repository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private UploadFileUseCase uploadUseCase;

    private PdfFile savedFile;

    @BeforeEach
    void setUp() {
        savedFile = PdfFile.builder()
                .id(UUID.randomUUID())
                .filename("test.pdf")
                .s3Key("stub/test.pdf")
                .size(1024L)
                .contentType("application/pdf")
                .uploadedAt(Instant.now())
                .build();
    }

    @Test
    void uploadFileShouldReturnFileResponseWhenFileIsValid() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", new byte[1024]);

        when(storageService.uploadFile(file)).thenReturn("stub/test.pdf");
        when(repository.save(any(PdfFile.class))).thenReturn(savedFile);

        FileResponse response = uploadUseCase.uploadFile(file);

        assertNotNull(response);
        assertEquals(savedFile.getId(), response.id());
        assertEquals("test.pdf", response.filename());
        assertEquals(1024L, response.size());
        assertEquals("application/pdf", response.contentType());

        verify(storageService).uploadFile(file);
        verify(repository).save(any(PdfFile.class));
    }

    @Test
    void uploadFileShouldThrowFileValidationExceptionWhenFileIsEmpty() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]);

        FileValidationException ex = assertThrows(
                FileValidationException.class, () -> uploadUseCase.uploadFile(file));

        assertEquals("File is empty", ex.getMessage());
        verifyNoInteractions(storageService, repository);
    }

    @Test
    void uploadFileShouldThrowFileValidationExceptionWhenFileIsTooLarge() {
        byte[] oversizedContent = new byte[51 * 1024 * 1024]; // 51MB
        MockMultipartFile file = new MockMultipartFile(
                "file", "large.pdf", "application/pdf", oversizedContent);

        FileValidationException ex = assertThrows(
                FileValidationException.class, () -> uploadUseCase.uploadFile(file));

        assertEquals("File exceeds the 50MB limit", ex.getMessage());
        verifyNoInteractions(storageService, repository);
    }

    @Test
    void uploadFileShouldThrowFileValidationExceptionWhenContentTypeIsNotPdf() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "image.png", "image/png", new byte[1024]);

        FileValidationException ex = assertThrows(
                FileValidationException.class, () -> uploadUseCase.uploadFile(file));

        assertEquals("Only PDF files are allowed", ex.getMessage());
        verifyNoInteractions(storageService, repository);
    }

    @Test
    void uploadFileShouldNotSaveMetadataWhenStorageFails() throws IOException {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", new byte[1024]);

        when(storageService.uploadFile(file)).thenThrow(new IOException("S3 unavailable"));

        assertThrows(FileStorageException.class, () -> uploadUseCase.uploadFile(file));
        verifyNoInteractions(repository);
    }
}