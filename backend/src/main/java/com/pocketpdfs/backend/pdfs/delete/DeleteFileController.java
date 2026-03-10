package com.pocketpdfs.backend.pdfs.delete;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class DeleteFileController {

    private final DeleteFileUseCase deleteFileUseCase;

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        deleteFileUseCase.deleteFile(id);
    }
}
