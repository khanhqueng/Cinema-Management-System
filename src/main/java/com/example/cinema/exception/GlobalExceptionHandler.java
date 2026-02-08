package com.example.cinema.exception;

import com.example.cinema.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.util.ArrayList;
import java.util.List;

/**
 * Global exception handler for the cinema application
 * Provides consistent error responses across all endpoints
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle Resource Not Found exceptions
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {

        log.warn("Resource not found: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage(),
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(SeatLockException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRuleViolationException(
            SeatLockException ex, HttpServletRequest request) {

        log.warn("Race condition exception: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Race Condition Error",
                ex.getMessage(),
                request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle Business Rule Violation exceptions
     */
    @ExceptionHandler(BusinessRuleViolationException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRuleViolationException(
            BusinessRuleViolationException ex, HttpServletRequest request) {

        log.warn("Business rule violation: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            "Business Rule Violation",
            ex.getMessage(),
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle Unauthorized exceptions
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedException(
            UnauthorizedException ex, HttpServletRequest request) {

        log.warn("Unauthorized access: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.FORBIDDEN.value(),
            "Forbidden",
            ex.getMessage(),
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    /**
     * Handle Validation exceptions
     */
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            ValidationException ex, HttpServletRequest request) {

        log.warn("Validation error: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            "Validation Error",
            ex.getMessage(),
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle method argument not valid (Bean Validation)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        log.warn("Validation failed: {}", ex.getMessage());

        List<ErrorResponse.ValidationError> validationErrors = new ArrayList<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            Object rejectedValue = ((FieldError) error).getRejectedValue();

            validationErrors.add(ErrorResponse.ValidationError.builder()
                    .field(fieldName)
                    .message(message)
                    .rejectedValue(rejectedValue)
                    .build());
        });

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            "Validation Failed",
            "Input validation failed",
            request.getRequestURI(),
            validationErrors
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle bind exceptions
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> handleBindException(
            BindException ex, HttpServletRequest request) {

        log.warn("Bind exception: {}", ex.getMessage());

        List<ErrorResponse.ValidationError> validationErrors = new ArrayList<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            Object rejectedValue = ((FieldError) error).getRejectedValue();

            validationErrors.add(ErrorResponse.ValidationError.builder()
                    .field(fieldName)
                    .message(message)
                    .rejectedValue(rejectedValue)
                    .build());
        });

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            "Validation Failed",
            "Request binding failed",
            request.getRequestURI(),
            validationErrors
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle constraint violation exceptions
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolationException(
            ConstraintViolationException ex, HttpServletRequest request) {

        log.warn("Constraint violation: {}", ex.getMessage());

        List<ErrorResponse.ValidationError> validationErrors = new ArrayList<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String fieldName = violation.getPropertyPath().toString();
            String message = violation.getMessage();
            Object rejectedValue = violation.getInvalidValue();

            validationErrors.add(ErrorResponse.ValidationError.builder()
                    .field(fieldName)
                    .message(message)
                    .rejectedValue(rejectedValue)
                    .build());
        }

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            "Constraint Violation",
            "Constraint validation failed",
            request.getRequestURI(),
            validationErrors
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle authentication exceptions
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {

        log.warn("Authentication failed: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.UNAUTHORIZED.value(),
            "Unauthorized",
            "Authentication failed",
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Handle bad credentials exceptions
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(
            BadCredentialsException ex, HttpServletRequest request) {

        log.warn("Bad credentials: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.UNAUTHORIZED.value(),
            "Unauthorized",
            "Invalid email or password",
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Handle access denied exceptions
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {

        log.warn("Access denied: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.FORBIDDEN.value(),
            "Forbidden",
            "Access denied. You don't have permission to access this resource",
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    /**
     * Handle data integrity violation exceptions
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolationException(
            DataIntegrityViolationException ex, HttpServletRequest request) {

        log.warn("Data integrity violation: {}", ex.getMessage());

        String message = "Data integrity violation";
        if (ex.getMessage().contains("Duplicate entry")) {
            message = "A record with this information already exists";
        } else if (ex.getMessage().contains("foreign key constraint")) {
            message = "Cannot delete this record because it is referenced by other data";
        }

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.CONFLICT.value(),
            "Data Integrity Violation",
            message,
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /**
     * Handle method not allowed exceptions
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupportedException(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {

        log.warn("Method not allowed: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.METHOD_NOT_ALLOWED.value(),
            "Method Not Allowed",
            "HTTP method " + ex.getMethod() + " is not supported for this endpoint",
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.METHOD_NOT_ALLOWED);
    }

    /**
     * Handle media type not supported exceptions
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpMediaTypeNotSupportedException(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {

        log.warn("Media type not supported: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.UNSUPPORTED_MEDIA_TYPE.value(),
            "Unsupported Media Type",
            "Media type is not supported. Supported types: " + ex.getSupportedMediaTypes(),
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    /**
     * Handle missing request parameter exceptions
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameterException(
            MissingServletRequestParameterException ex, HttpServletRequest request) {

        log.warn("Missing request parameter: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            "Missing Parameter",
            "Required parameter '" + ex.getParameterName() + "' is missing",
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle method argument type mismatch exceptions
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {

        log.warn("Method argument type mismatch: {}", ex.getMessage());

        String message = String.format("Parameter '%s' should be of type '%s'",
                ex.getName(), ex.getRequiredType().getSimpleName());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            "Type Mismatch",
            message,
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle malformed JSON requests
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadableException(
            HttpMessageNotReadableException ex, HttpServletRequest request) {

        log.warn("Malformed JSON request: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            "Malformed JSON",
            "Request body contains malformed JSON",
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle no handler found exceptions
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoHandlerFoundException(
            NoHandlerFoundException ex, HttpServletRequest request) {

        log.warn("No handler found: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            "The requested endpoint was not found",
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle illegal argument exceptions
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgumentException(
            IllegalArgumentException ex, HttpServletRequest request) {

        log.warn("Illegal argument: {}", ex.getMessage());

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            ex.getMessage(),
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, HttpServletRequest request) {

        log.error("Unexpected error occurred: ", ex);

        ErrorResponse error = ErrorResponse.of(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            "An unexpected error occurred. Please try again later",
            request.getRequestURI()
        );

        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}