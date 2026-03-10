package com.pocketpdfs.backend.pdfs.list;

import com.pocketpdfs.backend.pdfs.IPdfFilesRepository;
import com.pocketpdfs.backend.pdfs.PdfFile;
import com.pocketpdfs.backend.pdfs.shared.FileResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListFilesUseCaseTest {

    @Mock
    private IPdfFilesRepository repository;

    @InjectMocks
    private ListFilesUseCase listFilesUseCase;

    @Test
    void listShouldReturnFileResponseListFilesWhenFilesExist() {
        PdfFile file1 = PdfFile.builder()
                .id(UUID.randomUUID())
                .filename("first.pdf")
                .s3Key("stub/first.pdf")
                .size(512L)
                .contentType("application/pdf")
                .uploadedAt(Instant.now())
                .build();

        PdfFile file2 = PdfFile.builder()
                .id(UUID.randomUUID())
                .filename("second.pdf")
                .s3Key("stub/second.pdf")
                .size(2048L)
                .contentType("application/pdf")
                .uploadedAt(Instant.now().minusSeconds(60))
                .build();

        when(repository.findAllByOrderByUploadedAtDesc()).thenReturn(List.of(file1, file2));

        List<FileResponse> responses = listFilesUseCase.listFiles();

        assertEquals(2, responses.size());
        assertEquals("first.pdf", responses.get(0).filename());
        assertEquals("second.pdf", responses.get(1).filename());
    }

    @Test
    void listShouldReturnEmptyListFilesWhenNoFilesExist() {
        when(repository.findAllByOrderByUploadedAtDesc()).thenReturn(List.of());

        List<FileResponse> responses = listFilesUseCase.listFiles();

        assertNotNull(responses);
        assertTrue(responses.isEmpty());
    }
}