package com.pocketpdfs.backend.pdfs;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IPdfFilesRepository extends JpaRepository<PdfFile, UUID> {

    List<PdfFile> findAllByOrderByUploadedAtDesc();

    Optional<PdfFile> findByS3Key(String s3Key);

    boolean existsByFilename(String filename);
}
