package com.pocketpdfs.backend.pdfs.upload;

import com.pocketpdfs.backend.pdfs.shared.FileResponse;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Validated
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class UploadFileController {

    private final UploadFileUseCase uploadUseCase;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public FileResponse upload(@RequestParam("file") @NotNull MultipartFile file) throws IOException {
        return uploadUseCase.uploadFile(file);
    }
}