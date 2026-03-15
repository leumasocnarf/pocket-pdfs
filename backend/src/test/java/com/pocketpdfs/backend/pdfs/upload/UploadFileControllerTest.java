package com.pocketpdfs.backend.pdfs.upload;

import com.pocketpdfs.backend.pdfs.shared.FileResponse;
import com.pocketpdfs.backend.security.TestSecurityConfiguration;
import com.pocketpdfs.backend.security.auth.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UploadFileController.class)
@Import(TestSecurityConfiguration.class)
class UploadFileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UploadFileUseCase uploadUseCase;

    @MockitoBean
    private JwtProvider jwtProvider;

    @Test
    void uploadIsValid() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", new byte[1024]);

        FileResponse response = new FileResponse(
                UUID.randomUUID(), "test.pdf", 1024L, "application/pdf", Instant.now().toString());

        when(uploadUseCase.uploadFile(any())).thenReturn(response);

        mockMvc.perform(multipart("/api/files/upload").file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.filename").value("test.pdf"))
                .andExpect(jsonPath("$.size").value(1024))
                .andExpect(jsonPath("$.contentType").value("application/pdf"));
    }

    @Test
    void uploadPartIsMissing() throws Exception {
        mockMvc.perform(multipart("/api/files/upload"))
                .andExpect(status().isBadRequest());
    }
}