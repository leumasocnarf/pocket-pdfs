package com.pocketpdfs.backend.pdfs.delete;

import com.pocketpdfs.backend.pdfs.IPdfFilesRepository;
import com.pocketpdfs.backend.pdfs.PdfFile;
import com.pocketpdfs.backend.pdfs.shared.ResourceNotFoundException;
import com.pocketpdfs.backend.s3.StorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeleteFileUseCaseTest {

    @Mock
    private IPdfFilesRepository repository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private DeleteFileUseCase deleteFileUseCase;

    @Test
    void deleteFileShouldDeleteFromStorageAndRepositoryWhenFileExists() {
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

        deleteFileUseCase.deleteFile(id);

        verify(storageService).deleteFile("stub/test.pdf");
        verify(repository).delete(file);
    }

    @Test
    void deleteFileShouldDeleteFromStorageBeforeRepository() {
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

        var inOrder = inOrder(storageService, repository);
        deleteFileUseCase.deleteFile(id);

        inOrder.verify(storageService).deleteFile("stub/test.pdf");
        inOrder.verify(repository).delete(file);
    }

    @Test
    void deleteFileShouldThrowResourceNotFoundExceptionWhenFileDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> deleteFileUseCase.deleteFile(id));
        verifyNoInteractions(storageService);
    }
}