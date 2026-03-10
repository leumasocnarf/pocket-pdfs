package com.pocketpdfs.backend.pdfs.list;

import com.pocketpdfs.backend.pdfs.IPdfFilesRepository;
import com.pocketpdfs.backend.pdfs.shared.FileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ListFilesUseCase {

    private final IPdfFilesRepository repository;

    public List<FileResponse> listFiles() {
        return repository.findAllByOrderByUploadedAtDesc()
                .stream()
                .map(FileResponse::from)
                .collect(Collectors.toList());
    }
}