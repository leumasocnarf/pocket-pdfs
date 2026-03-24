package com.pocketpdfs.backend.pdfs.download;

import com.pocketpdfs.backend.pdfs.shared.ResourceNotFoundException;
import com.pocketpdfs.backend.pdfs.shared.UrlResponse;
import com.pocketpdfs.backend.security.TestSecurityConfiguration;
import com.pocketpdfs.backend.security.auth.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DownloadFileController.class)
@Import(TestSecurityConfiguration.class)
class DownloadFileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DownloadFileUseCase downloadFileUseCase;

    @MockitoBean
    private JwtProvider jwtProvider;

    @Test
    void downloadShouldReturn200WithUrlWhenFileExists() throws Exception {
        UUID id = UUID.randomUUID();
        UrlResponse response = new UrlResponse(id, "test.pdf", "http://localhost/stub/test.pdf?expires=300s");

        when(downloadFileUseCase.downloadFile(id)).thenReturn(response);

        mockMvc.perform(get("/api/files/{id}/download", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.filename").value("test.pdf"))
                .andExpect(jsonPath("$.url").value("http://localhost/stub/test.pdf?expires=300s"));
    }

    @Test
    void downloadShouldReturn404WhenFileDoesNotExist() throws Exception {
        UUID id = UUID.randomUUID();
        when(downloadFileUseCase.downloadFile(id)).thenThrow(new ResourceNotFoundException(id));

        mockMvc.perform(get("/api/files/{id}/download", id))
                .andExpect(status().isNotFound());
    }
}