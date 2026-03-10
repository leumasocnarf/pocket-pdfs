package com.pocketpdfs.backend.s3;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class InMemoryStorageService implements StorageService {

    // Simulates stored files: key → original filename
    private final Map<String, String> store = new ConcurrentHashMap<>();

    @Override
    public String uploadFile(MultipartFile file) {
        String key = "stub/" + UUID.randomUUID() + "/" + file.getOriginalFilename();
        store.put(key, file.getOriginalFilename());
        log.info("[InMemoryStorage] Uploaded: key={}, filename={}", key, file.getOriginalFilename());
        return key;
    }

    @Override
    public String generatePresignedUrl(String key, Duration expiry) {
        if (!store.containsKey(key)) {
            throw new IllegalStateException("[InMemoryStorage] No file found for key: " + key);
        }
        String url = "http://localhost:8080/stub-storage/" + key + "?expires=" + expiry.toSeconds() + "s";
        log.info("[InMemoryStorage] Generated URL: {}", url);
        return url;
    }

    @Override
    public void deleteFile(String key) {
        if (store.remove(key) == null) {
            throw new IllegalStateException("[InMemoryStorage] No file found for key: " + key);
        }
        log.info("[InMemoryStorage] Deleted: key={}", key);
    }
}
