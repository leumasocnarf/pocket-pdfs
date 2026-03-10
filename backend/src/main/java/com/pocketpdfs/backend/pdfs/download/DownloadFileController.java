package com.pocketpdfs.backend.pdfs.download;

import com.pocketpdfs.backend.pdfs.shared.UrlResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class DownloadFileController {

    private final DownloadFileUseCase downloadFileUseCase;

    @GetMapping("/{id}/download")
    public UrlResponse download(@PathVariable UUID id) {
        return downloadFileUseCase.downloadFile(id);
    }
}
