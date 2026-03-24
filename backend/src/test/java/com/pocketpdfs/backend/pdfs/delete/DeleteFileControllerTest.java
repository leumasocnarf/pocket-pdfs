package com.pocketpdfs.backend.pdfs.delete;

import com.pocketpdfs.backend.pdfs.shared.ResourceNotFoundException;
import com.pocketpdfs.backend.security.TestSecurityConfiguration;
import com.pocketpdfs.backend.security.auth.JwtProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DeleteFileController.class)
@Import(TestSecurityConfiguration.class)
class DeleteFileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DeleteFileUseCase deleteFileUseCase;

    @MockitoBean
    private JwtProvider jwtProvider;

    @Test
    void deleteShouldReturn204WhenFileExists() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(deleteFileUseCase).deleteFile(id);

        mockMvc.perform(delete("/api/files/{id}", id))
                .andExpect(status().isNoContent());

        verify(deleteFileUseCase).deleteFile(id);
    }

    @Test
    void deleteShouldReturn404WhenFileDoesNotExist() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ResourceNotFoundException(id)).when(deleteFileUseCase).deleteFile(id);

        mockMvc.perform(delete("/api/files/{id}", id))
                .andExpect(status().isNotFound());
    }
}