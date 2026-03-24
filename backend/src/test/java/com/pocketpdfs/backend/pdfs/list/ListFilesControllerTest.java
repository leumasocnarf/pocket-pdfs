package com.pocketpdfs.backend.pdfs.list;

import com.pocketpdfs.backend.pdfs.shared.FileResponse;
import com.pocketpdfs.backend.security.TestSecurityConfiguration;
import com.pocketpdfs.backend.security.auth.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ListFilesController.class)
@Import(TestSecurityConfiguration.class)
class ListFilesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ListFilesUseCase listFilesUseCase;

    @MockitoBean
    private JwtProvider jwtProvider;

    @Test
    void listShouldReturn200WithFileListWhenFilesExist() throws Exception {
        List<FileResponse> responses = List.of(
                new FileResponse(UUID.randomUUID(), "first.pdf", 512L, "application/pdf", Instant.now().toString()),
                new FileResponse(UUID.randomUUID(), "second.pdf", 2048L, "application/pdf", Instant.now().toString())
        );

        when(listFilesUseCase.listFiles()).thenReturn(responses);

        mockMvc.perform(get("/api/files"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].filename").value("first.pdf"))
                .andExpect(jsonPath("$[1].filename").value("second.pdf"));
    }

    @Test
    void listShouldReturn200WithEmptyListWhenNoFilesExist() throws Exception {
        when(listFilesUseCase.listFiles()).thenReturn(List.of());

        mockMvc.perform(get("/api/files"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}