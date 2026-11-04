package usc.enser.CatchThemAll.presentation.controller;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockPart;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.example.grpc.CaptureCreationResponse;

import usc.enser.CatchThemAll.presentation.dto.CaptureCreateRequest;
import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;
import usc.enser.CatchThemAll.service.interfaces.ICaptureService;
import usc.enser.CatchThemAll.service.interfaces.ICurrentUserService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pins the capture controller contract: the multipart body carries plain form fields
 * ({@code image} plus {@code name}) instead of a nested JSON part, and the capture history always
 * resolves to the authenticated user.
 */
class CaptureControllerTest {

    private final ICaptureService captureService = mock(ICaptureService.class);
    private final ICurrentUserService currentUserService = mock(ICurrentUserService.class);
    private final Executor executor = Runnable::run;

    private MockMvc mvc;

    private final UUID userId = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private final UUID famousId = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private final UUID captureId = UUID.fromString("33333333-3333-3333-3333-333333333333");

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
                .standaloneSetup(new CaptureController(captureService, currentUserService, executor))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("create accepts image and name as plain form fields")
    void createAcceptsImageAndNameAsFormFields() throws Exception {
        when(captureService.create(any(), any()))
                .thenReturn(CompletableFuture.completedFuture(CaptureCreationResponse.newBuilder().build()));

        MvcResult result = mvc.perform(multipart("/captures/create")
                        .file(new MockMultipartFile("image", "face.jpg", "image/jpeg", new byte[] {1, 2, 3}))
                        .part(new MockPart("name", "Ada Lovelace".getBytes(StandardCharsets.UTF_8))))
                .andExpect(request().asyncStarted())
                .andReturn();

        mvc.perform(asyncDispatch(result)).andExpect(status().isCreated());

        ArgumentCaptor<CaptureCreateRequest> captor = ArgumentCaptor.forClass(CaptureCreateRequest.class);
        verify(captureService).create(any(), captor.capture());
        assertThat(captor.getValue().name()).isEqualTo("Ada Lovelace");
    }

    @Test
    @DisplayName("create rejects a blank name with a validation error")
    void createRejectsBlankName() throws Exception {
        mvc.perform(multipart("/captures/create")
                        .file(new MockMultipartFile("image", "face.jpg", "image/jpeg", new byte[] {1, 2, 3}))
                        .part(new MockPart("name", "   ".getBytes(StandardCharsets.UTF_8))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("validation failed"))
                .andExpect(jsonPath("$.details[0]").value("name: must not be blank"));
    }

    @Test
    @DisplayName("create rejects a request without the image part")
    void createRejectsMissingImage() throws Exception {
        mvc.perform(multipart("/captures/create").part(new MockPart("name", "Ada Lovelace".getBytes(StandardCharsets.UTF_8))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("malformed request"));
    }

    @Test
    @DisplayName("identify resolves the path user id and reads the name form field")
    void identifyAcceptsImageAndNameAsFormFields() throws Exception {
        when(captureService.identify(eq(userId), any(), any()))
                .thenReturn(CompletableFuture.completedFuture(captureResponse()));

        MvcResult result = mvc.perform(multipart("/captures/{id}/identify", userId)
                        .file(new MockMultipartFile("image", "face.jpg", "image/jpeg", new byte[] {1, 2, 3}))
                        .part(new MockPart("name", "Ada Lovelace".getBytes(StandardCharsets.UTF_8))))
                .andExpect(request().asyncStarted())
                .andReturn();

        mvc.perform(asyncDispatch(result))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.famousName").value("Ada Lovelace"));

        ArgumentCaptor<CaptureCreateRequest> captor = ArgumentCaptor.forClass(CaptureCreateRequest.class);
        verify(captureService).identify(eq(userId), any(), captor.capture());
        assertThat(captor.getValue().name()).isEqualTo("Ada Lovelace");
    }

    @Test
    @DisplayName("GET /captures/me returns the authenticated user history")
    void findMineUsesAuthenticatedUser() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(captureService.findMine(userId)).thenReturn(List.of(captureResponse()));

        mvc.perform(get("/captures/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].captureId").value(captureId.toString()))
                .andExpect(jsonPath("$[0].famousName").value("Ada Lovelace"));

        verify(captureService).findMine(userId);
    }

    @Test
    @DisplayName("GET /captures/me/{captureId} returns one authenticated capture")
    void findMineByIdUsesAuthenticatedUser() throws Exception {
        when(currentUserService.getCurrentUserId()).thenReturn(userId);
        when(captureService.findMineById(userId, captureId)).thenReturn(captureResponse());

        mvc.perform(get("/captures/me/{captureId}", captureId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.captureId").value(captureId.toString()));

        verify(captureService).findMineById(userId, captureId);
    }

    private CaptureResponse captureResponse() {
        return new CaptureResponse(captureId, famousId, "Ada Lovelace", 0.93, true,
                Timestamp.valueOf("2026-01-01 10:00:00"));
    }
}
