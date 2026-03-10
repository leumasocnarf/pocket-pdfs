package com.pocketpdfs.backend.pdfs.list;

import com.pocketpdfs.backend.pdfs.shared.FileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class ListFilesController {

    private final ListFilesUseCase listFilesUseCase;

    @GetMapping
    public List<FileResponse> list() {
        return listFilesUseCase.listFiles();
    }
}
