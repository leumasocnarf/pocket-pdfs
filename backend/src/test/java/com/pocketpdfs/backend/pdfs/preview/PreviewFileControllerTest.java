package com.pocketpdfs.backend.pdfs.preview;

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

@WebMvcTest(PreviewFileController.class)
@Import(TestSecurityConfiguration.class)
class PreviewFileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PreviewFileUseCase previewFileUseCase;

    @MockitoBean
    private JwtProvider jwtProvider;

    @Test
    void previewShouldReturn200WithUrlWhenFileExists() throws Exception {
        UUID id = UUID.randomUUID();
        UrlResponse response = new UrlResponse(id, "test.pdf", "http://localhost/stub/test.pdf?expires=900s");

        when(previewFileUseCase.previewFile(id)).thenReturn(response);

        mockMvc.perform(get("/api/files/{id}/preview", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.filename").value("test.pdf"))
                .andExpect(jsonPath("$.url").value("http://localhost/stub/test.pdf?expires=900s"));
    }

    @Test
    void previewShouldReturn404WhenFileDoesNotExist() throws Exception {
        UUID id = UUID.randomUUID();
        when(previewFileUseCase.previewFile(id)).thenThrow(new ResourceNotFoundException(id));

        mockMvc.perform(get("/api/files/{id}/preview", id));
    }
}