package com.pocketpdfs.backend.pdfs.preview;

import com.pocketpdfs.backend.pdfs.shared.UrlResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class PreviewFileController {

    private final PreviewFileUseCase previewFileUseCase;

    @GetMapping("/{id}/previewFile")
    public UrlResponse preview(@PathVariable UUID id) {
        return previewFileUseCase.previewFile(id);
    }
}
