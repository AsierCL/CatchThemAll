package usc.enser.CatchThemAll.presentation.controller;

import java.time.Instant;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import usc.enser.CatchThemAll.exception.ApiException;
import usc.enser.CatchThemAll.presentation.dto.ErrorDTO;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorDTO> handleApi(ApiException exception, HttpServletRequest request) {
        return build(exception.getStatus(), exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDTO> handleValidation(MethodArgumentNotValidException exception, HttpServletRequest request) {
        List<String> details = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .toList();
        return build(HttpStatus.BAD_REQUEST, "validation failed", request, details);
    }

    @ExceptionHandler({
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class,
            MissingServletRequestPartException.class
    })
    public ResponseEntity<ErrorDTO> handleMalformedRequest(Exception exception, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "malformed request", request, List.of());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorDTO> handleNotFound(NoResourceFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "resource not found", request, List.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorDTO> handleMethodNotSupported(HttpRequestMethodNotSupportedException exception,
                                                             HttpServletRequest request) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "method not allowed", request, List.of());
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorDTO> handleMediaTypeNotSupported(HttpMediaTypeNotSupportedException exception,
                                                                HttpServletRequest request) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "unsupported media type", request, List.of());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ErrorDTO> handleResponseStatus(ResponseStatusException exception, HttpServletRequest request) {
        HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());
        return build(status == null ? HttpStatus.INTERNAL_SERVER_ERROR : status, exception.getReason(), request, List.of());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorDTO> handleAccessDenied(AccessDeniedException exception, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "access denied", request, List.of());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDTO> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), exception);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "unexpected error", request, List.of());
    }

    private ResponseEntity<ErrorDTO> build(HttpStatus status, String message, HttpServletRequest request,
                                           List<String> details) {
        ErrorDTO body = new ErrorDTO(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI(),
                details);
        return ResponseEntity.status(status).body(body);
    }
}
