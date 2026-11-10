package usc.enser.CatchThemAll.presentation.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import usc.enser.CatchThemAll.enums.FamousCategories;
import usc.enser.CatchThemAll.enums.FamousTypes;
import usc.enser.CatchThemAll.presentation.dto.ErrorDTO;
import usc.enser.CatchThemAll.presentation.dto.FamousResponse;
import usc.enser.CatchThemAll.service.interfaces.IFamousService;

@RestController
@RequestMapping("/famous")
@Tag(name = "Famosos", description = "Catalogo de famosos que se pueden capturar.")
public class FamousController {

    private final IFamousService famousService;

    public FamousController(IFamousService famousService) {
        this.famousService = famousService;
    }

    @Operation(
            operationId = "listFamous",
            summary = "Listar famosos",
            description = """
                    Devuelve el catalogo completo o filtrado por tipo y categoria. Los filtros no
                    distinguen mayusculas y minusculas. Cada elemento incluye el total de capturas
                    registradas (`captureCount`) y la cantidad de usuarios distintos que lo capturaron
                    (`collectorCount`).

                    > La respuesta se sirve desde cache, asi que `captureCount` y `collectorCount` pueden
                    > quedar desactualizados. La vigencia esta en la seccion de cache del documento, y el
                    > punto esta abierto en `TODO.md` en la raiz del repositorio.
                    """)
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de famosos"),
            @ApiResponse(responseCode = "400", description = "Valor de filtro desconocido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @GetMapping
    public List<FamousResponse> findAll(
            @Parameter(description = "Filtra por tipo de famoso", example = "politic")
            @RequestParam(required = false) FamousTypes type,
            @Parameter(description = "Filtra por categoria de la Pokedex", example = "legendary")
            @RequestParam(required = false) FamousCategories category) {
        return famousService.findAll(type, category);
    }

    @Operation(
            operationId = "getFamous",
            summary = "Consultar un famoso",
            description = "Devuelve un famoso con sus estadisticas de captura.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Famoso encontrado"),
            @ApiResponse(responseCode = "400", description = "Identificador con formato invalido",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class))),
            @ApiResponse(responseCode = "404", description = "El famoso no existe",
                    content = @Content(schema = @Schema(implementation = ErrorDTO.class)))
    })
    @GetMapping("/{famousId}")
    public FamousResponse findById(
            @Parameter(description = "Identificador del famoso", required = true) @PathVariable UUID famousId) {
        return famousService.findById(famousId);
    }
}
