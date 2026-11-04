# CatchThemAll

Pokedex de famosos con capturas por reconocimiento facial. El proyecto tiene dos piezas:

- `CatchThemAll/`: API REST en Spring Boot 4 (Java 25) con Postgres + pgvector.
- `FacialRecognition/`: microservicio Python expuesto por gRPC (`proto/capture.proto`) que calcula los
  embeddings de los rostros con InsightFace.

## Documentación de la API

La API REST está documentada con OpenAPI 3.1 y springdoc. La fuente de verdad son las anotaciones en
el código (`@Tag`, `@Operation`, `@ApiResponses`, `@Schema`) más los metadatos de
`CatchThemAll/src/main/java/usc/enser/CatchThemAll/config/OpenApiConfig.java`.

| Recurso | Dónde |
| --- | --- |
| Swagger UI (siempre expuesto) | `http://localhost:8080/swagger-ui.html` |
| Documento JSON generado | `http://localhost:8080/v3/api-docs` |
| Documento YAML generado | `http://localhost:8080/v3/api-docs.yaml` |
| Artefacto versionado en el repo | `docs/openapi.json` |

### Regenerar `docs/openapi.json`

El artefacto lo escribe el test de contrato, así que se regenera corriendo la suite:

```bash
cd CatchThemAll
./mvnw test
```

`OpenApiContractTest` levanta la aplicación con la base H2 en memoria del perfil `test`, pide
`/v3/api-docs` y deja el resultado en `docs/openapi.json`. El mismo test falla si el documento deja de
declarar una ruta, una operación, un esquema o el esquema de seguridad esperado: es el contrato de la
documentación.

Para escribir el artefacto en otra ruta:

```bash
./mvnw test -Dopenapi.export.path=/tmp/openapi.json
```

### Consumir la API

1. `POST /auth/register` o `POST /auth/login` devuelve un token JWT (HS256, 15 minutos).
2. Enviarlo como `Authorization: Bearer <token>` en las operaciones que lo requieren.
3. Todos los errores comparten el esquema `ErrorDTO`: `timestamp`, `status`, `error`, `message`,
   `path` y `details`.

Los endpoints de capturas usan `multipart/form-data` con dos partes simples, `image` (archivo) y
`name` (texto). Los valores de enum viajan en minúsculas (`legendary`, `politic`, ...).

## Puesta en marcha

```bash
cd CatchThemAll
docker compose up -d postgres     # Postgres + pgvector en localhost:7777
./mvnw spring-boot:run            # API en localhost:8080
```

El servicio de reconocimiento facial es opcional para explorar la documentación: los endpoints de
capturas devuelven `503` mientras no esté escuchando en `localhost:9090`.

```bash
cd FacialRecognition
pip install -r requirements.txt
python -m capture_service.server
```

## Tests

```bash
cd CatchThemAll
./mvnw test
```

Los tests usan H2 en memoria (`src/test/resources/application-test.properties`) y no necesitan el
Postgres de Docker ni el servicio gRPC.

## Pendientes conocidos

Ver [`TODO.md`](TODO.md). La documentación describe el comportamiento actual, incluidas las
inconsistencias que quedaron registradas ahí.
