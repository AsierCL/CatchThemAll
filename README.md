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

El artefacto lo escribe `springdoc-openapi-maven-plugin` durante la fase `integration-test`: el build
arranca la aplicación con el perfil `openapi`, le pide `/v3/api-docs`, escribe el archivo y la apaga.

```bash
cd CatchThemAll
./mvnw clean verify
```

El perfil `openapi` (`src/main/resources/application-openapi.properties`) levanta una base H2 en
memoria en el puerto `18080` y desactiva el soporte de docker-compose, así que **no** hace falta el
Postgres de desarrollo ni el servicio gRPC para generar la documentación.

Si el build falla en la fase de `test` con clases viejas en `target/`, es porque quedó compilado algo
que ya no existe: `clean` lo resuelve.

### Consumir la API

1. `POST /auth/register` o `POST /auth/login` devuelve un par de tokens: `token` (JWT, HS256, 15
   minutos) y `refreshToken` (opaco, 24 horas).
2. Enviar el JWT como `Authorization: Bearer <token>` en las operaciones que lo requieren.
3. Cuando el JWT vence, `POST /auth/refresh` lo renueva enviando el `refreshToken`. El refresh token
   se **rota** en cada llamada: el que se envió queda inválido y hay que guardar el nuevo. Reutilizar
   uno viejo devuelve `404`; uno vencido devuelve `401` y obliga a iniciar sesión otra vez.
4. Editar el perfil propio: `PUT /users/me` reemplaza los tres campos, `PATCH /users/me` aplica un
   documento JSON Patch (RFC 6902) con `Content-Type: application/json-patch+json`. Hoy ambas rutas
   devuelven `500` porque el handler declara un `@PathVariable` que la ruta no provee (ver
   [`TODO.md`](TODO.md)).
5. Todos los errores comparten el esquema `ErrorDTO`: `timestamp`, `status`, `error`, `message`,
   `path` y `details`.

Los endpoints de capturas usan `multipart/form-data` con partes simples: `image` (archivo) más `name`
(texto) en `POST /captures/{id}/identify`, y `image` más `data` (texto) en `POST /captures/create`.
Los valores de enum viajan en minúsculas (`legendary`, `politic`, ...).

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

## Pendientes conocidos

Ver [`TODO.md`](TODO.md). La documentación describe el comportamiento actual, incluidas las
inconsistencias que quedaron registradas ahí. Los arreglos van en una rama aparte de errores lógicos.
