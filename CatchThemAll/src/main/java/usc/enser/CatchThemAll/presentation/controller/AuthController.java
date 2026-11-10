package usc.enser.CatchThemAll.presentation.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import usc.enser.CatchThemAll.presentation.dto.*;
import usc.enser.CatchThemAll.service.interfaces.IAuthService;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@Tag(name = "Autenticacion", description = "Registro de usuarios y emision del token JWT.")
public class AuthController {

    private final IAuthService authService;

    public AuthController(IAuthService authService) {
        this.authService = authService;
    }

    @Operation(
            operationId = "login",
            summary = "Iniciar sesion",
            description = """
                    Valida las credenciales y devuelve un token JWT firmado con HS256.
                    El token vence a los 15 minutos y se envia como `Authorization: Bearer <token>`.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Credenciales validas: token emitido"),
            @ApiResponse(responseCode = "400", description = "Cuerpo invalido o campos faltantes",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "401", description = "Usuario o contrasena incorrectos",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "415", description = "Content-Type no soportado",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @PostMapping("/login")
    public TokenResponse login(@RequestBody @Valid UserLogin request) {
        return authService.login(request);
    }

    @Operation(
            operationId = "register",
            summary = "Registrar un usuario",
            description = """
                    Crea la cuenta y devuelve el token JWT en la misma respuesta, sin necesidad de
                    iniciar sesion despues del registro. El nombre y el email son unicos.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cuenta creada: token emitido"),
            @ApiResponse(responseCode = "400", description = "Cuerpo invalido o campos faltantes",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "409", description = "El nombre o el email ya estan en uso",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "415", description = "Content-Type no soportado",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @PostMapping("/register")
    public TokenResponse register(@RequestBody @Valid UserRegister request) {
        return authService.register(request);
    }

    @Operation(
            operationId = "refreshToken",
            summary = "Renovar el par de tokens",
            description = """
                    Canjea el `refreshToken` obtenido en `POST /auth/login` o `POST /auth/register` por un
                    par nuevo.

                    El token se rota: el que se envia se invalida en la misma operacion y la respuesta
                    trae uno distinto, asi que reutilizar el anterior devuelve `404`. Si el token esta
                    vencido se borra y la respuesta es `401`, obligando a iniciar sesion de nuevo.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Par de tokens renovado"),
            @ApiResponse(responseCode = "400", description = "Cuerpo invalido o ilegible",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "401", description = "El refresh token vencio",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "El refresh token no existe o ya fue usado",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "415", description = "Content-Type no soportado",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @PostMapping("/refresh")
    public TokenResponse refreshToken(@RequestBody @Valid RefreshRequest request){ return authService.refresh(request); }
}
