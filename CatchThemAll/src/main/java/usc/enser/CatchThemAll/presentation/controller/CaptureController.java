package usc.enser.CatchThemAll.presentation.controller;

import java.util.List;
import java.nio.file.AccessDeniedException;
import java.util.concurrent.CompletableFuture;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.Executor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import usc.enser.CatchThemAll.presentation.dto.CaptureResponse;
import usc.enser.CatchThemAll.presentation.dto.ErrorDTO;
import usc.enser.CatchThemAll.service.interfaces.ICurrentUserService;
import usc.enser.CatchThemAll.service.interfaces.ICaptureService;

@RestController
@RequestMapping("/captures")
@Tag(name = "Capturas", description = "Capturas de famosos por reconocimiento facial e historial propio.")
public class CaptureController {

    private final ICaptureService captureService;
    private final ICurrentUserService currentUserService;
    private final Executor executor;

    public CaptureController(ICaptureService captureService, ICurrentUserService currentUserService,
                             Executor grpcExecutor) {
        this.captureService = captureService;
        this.currentUserService = currentUserService;
        this.executor = grpcExecutor;
    }

    @Operation(
            operationId = "identifyFamous",
            summary = "Identificar un famoso en una foto",
            description = """
                    Envia la foto al servicio de reconocimiento facial y compara el rostro contra las
                    muestras cargadas para el famoso indicado. La similitud viaja en `similarity`
                    (0 a 1) y el campo `captured` indica si el usuario ya tenia registrada esa captura
                    antes de esta peticion.

                    El cuerpo es `multipart/form-data` con dos partes: `image` (archivo) y `name`
                    (texto con el nombre del famoso).

                    Requiere autenticacion: el `{id}` del path tiene que coincidir con el usuario del
                    token. Cuando no coincide, la peticion se rechaza en lugar de registrar la captura
                    a nombre de otro usuario.

                    Si es la primera vez que el usuario captura a ese famoso, la operacion suma puntaje a su
                    perfil: la similitud se multiplica por 1000, 700, 400 o 100 segun la categoria del famoso
                    (legendary, epic, rare, common). Ese puntaje alimenta `GET /users/ranking`.

                    La respuesta es asincronica: el controlador devuelve un `CompletableFuture` que se
                    completa cuando el servicio gRPC de reconocimiento responde.

                    > El rechazo por propiedad todavia devuelve `500` en lugar de `403`, y un `name`
                    > vacio tampoco devuelve `400`. Ver `TODO.md` en la raiz del repositorio.
                    """,
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Identificacion resuelta"),
            @ApiResponse(responseCode = "400", description = "Falta el parte image o el cuerpo es ilegible",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "401", description = "Falta el token o es invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "El usuario o el famoso no existen, o el servicio no encontro coincidencia",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "413", description = "La imagen supera el limite de 10MB",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "415", description = "Content-Type no soportado",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "422", description = "La imagen no se pudo decodificar o no contiene caras",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "El `{id}` no coincide con el usuario del token, o el parte `name` esta vacio",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "503", description = "El servicio de reconocimiento no esta disponible",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "504", description = "El servicio de reconocimiento no respondio a tiempo",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @PostMapping(value = "/{id}/identify", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CompletableFuture<CaptureResponse> identify(
            @Parameter(description = "Identificador del usuario dueno de la captura", required = true)
            @PathVariable UUID id,
            @RequestPart("image") MultipartFile image,
            @RequestPart("name") @NotBlank @NotNull String name) throws IOException{

        if(currentUserService.getCurrentUserId().equals(id)){
            return captureService.identify(id,image,name);
        }else {
            throw new AccessDeniedException("No puedes subir capturas por otro usuario");
        }
    }

    @Operation(
            operationId = "createFamousFace",
            summary = "Registrar el rostro de un famoso",
            description = """
                    Carga una foto al servicio de reconocimiento facial para guardar el embedding del
                    famoso indicado. Es una operacion de carga de datos: no crea una captura, solo la
                    muestra de referencia que despues usan las identificaciones.

                    El cuerpo es `multipart/form-data` con dos partes: `image` (archivo) y `data`
                    (texto con el nombre del famoso). El parte de texto se llama `data` aunque no
                    contenga JSON; en `identify` el equivalente se llama `name`.

                    No exige autenticacion.

                    La respuesta es asincronica y devuelve `201 Created` sin cuerpo cuando el servicio
                    gRPC confirma la creacion.

                    > Un `data` vacio termina en `500` en lugar de `400`. Ver `TODO.md` en la raiz del
                    > repositorio.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Rostro registrado"),
            @ApiResponse(responseCode = "400", description = "Falta el parte image o el cuerpo es ilegible",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "413", description = "La imagen supera el limite de 10MB",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "415", description = "Content-Type no soportado",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "422", description = "La imagen no se pudo decodificar",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "500", description = "El parte `data` esta vacio",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "503", description = "El servicio de reconocimiento no esta disponible",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "504", description = "El servicio de reconocimiento no respondio a tiempo",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CompletableFuture<ResponseEntity<Void>> create(
            @RequestPart("image") MultipartFile image,
            @RequestPart("data") @NotBlank @NotNull String name) throws IOException {

        return captureService.create(image, name)
                .thenApply(response ->
                        ResponseEntity.status(HttpStatus.CREATED).build()
                );
    }

    @Operation(
            operationId = "listMyCaptures",
            summary = "Historial de capturas propias",
            description = """
                    Capturas del usuario autenticado, de la mas reciente a la mas antigua.

                    > La respuesta se sirve desde cache hasta 15 minutos y ninguna escritura la invalida,
                    > asi que una captura recien registrada puede no aparecer todavia. Ver `TODO.md` en la
                    > raiz del repositorio.
                    """,
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Historial de capturas"),
            @ApiResponse(responseCode = "401", description = "Falta el token o es invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "El usuario del token ya no existe",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })

    @GetMapping("/me")
    public List<CaptureResponse> findMine() {
        return captureService.findMine(currentUserService.getCurrentUserId());
    }

    @Operation(
            operationId = "getMyCapture",
            summary = "Consultar una captura propia",
            description = "Una captura del usuario autenticado. Devuelve `404` si la captura no existe o pertenece a otro usuario.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Captura encontrada"),
            @ApiResponse(responseCode = "400", description = "Identificador con formato invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "401", description = "Falta el token o es invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "La captura no existe o pertenece a otro usuario",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @GetMapping("/me/{captureId}")
    public CaptureResponse findMineById(
            @Parameter(description = "Identificador de la captura", required = true) @PathVariable UUID captureId) {
        return captureService.findMineById(currentUserService.getCurrentUserId(), captureId);
    }
}
