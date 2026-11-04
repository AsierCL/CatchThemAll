# OpenAPI / Swagger documentation for the CatchThemAll REST API

Branch: `docs/openapi-swagger` (created from `main`). Scope: Spring Boot REST only (no gRPC, no Python).
Method: springdoc-openapi 3.2.0 + annotations in code, exported to `docs/openapi.json`. Documentation language: Spanish.

## Specs

S1 — Branch: "Sigue tu recomendacion" → new branch `docs/openapi-swagger` created from `main`.
S2 — Approach: "Sigue tu recomendación" → springdoc + annotations; the code is the source of truth and the spec is generated.
S3 — Scope: "Solo rest java, quiero poder obtener un archivo openapi.json, por lo que de momento haz los controllers solo" → REST only, deliver an `openapi.json` artifact, work on controllers now.
S4 — Scope: "Documentar de momento" → no security hardening, no validation fixes, no PATCH/PUT redesign.
S5 — `SecurityConfig` keeps `.anyRequest().permitAll()`: "Esto está asi para facilitar las pruebas en desarrollo. Lo cambiaremos en las versiones finales." → documented as-is, TODO for the final version.
S6 — `POST /captures/{id}/identify` ownership: "Deja un TODO en la raiz del proyecto con ese cambio".
S7 — `captured` computed before persisting: "Deja un TODO en la raiz del proyecto con ese cambio".
S8 — Capture history: "Crea los endpoints y documentalos".
S9 — `@NotBlank` on `FriendRequest.friendId` (UUID): "No, metelo en el TODO de a raiz del proyecto".
S10 — `PUT`/`PATCH /users/{id}` behave as full replacement with `@NotNull` on every field: "Documentalo como esta ahora mismo y anotalo en el TODO de la raiz".
S11 — Multipart `data` JSON part: "Solucionalo de la forma mas apropiada posible, y anotalo en el TODO". **Superseded by S16/S18**: the multipart stays as it is and the flattening becomes a pending item in `TODO.md`.
S12 — Enum values `Legendary`/`Politic`/`Meme`: "Normaliza todo".
S13 — Versioned spec location: "Manten el estandar" → `docs/openapi.json`.
S14 — Swagger UI exposure: "Siempre expuesto" → no `dev` profile gate.
S15 — Documentation language: "Documenta en español" → `info`, `summary`, `description`, `@Schema(description)` in Spanish.

S16 — Testing: "No quiero ningun tipo de testing excepto lo únicamente necesario para que la documentación funcione. El resto de codigo no quiero testearlo. Ni en esta, ni en ninguna rama." → no test code at all; generation moves to a build plugin.

S17 — Generation: "Plugin de springdoc en el build" → `springdoc-openapi-maven-plugin` writes `docs/openapi.json` during `./mvnw verify`.

S18 — Deferred fixes: "En la proxima rama quiero hacer los cambios que vamos a dejar en el TODO (errores logicos y todo eso)" → every `TODO.md` item, including the multipart flattening, moves to a separate branch.

## Tasks

T1 — Create branch and ODD tracking. Spec: S1. Commit: 283868f (folded into the work units).
T2 — Add springdoc 3.2.0 + `OpenApiConfig` + properties. Spec: S2, S13, S14. Commit: 78cbcaf.
T3 — Normalize enums (lowercase JSON, case-insensitive input). Spec: S12. Commit: 5d03966.
T4 — Flatten capture multipart to `image` + `name`. **Reverted** by S16/S18: the multipart keeps the `data` JSON part and the flattening is now pending in `TODO.md`.
T5 — Add `GET /captures/me` and `GET /captures/me/{captureId}`. Spec: S8. Commit: 283868f.
T6 — Annotate the four controllers. Spec: S2, S3, S5, S10, S15. Commit: c264769 (+ 283868f for `CaptureController`).
T7 — Annotate the DTOs. Spec: S15. Commit: c264769.
T8 — Export `docs/openapi.json`. Spec: S3, S13. Commit: c264769 (test-based) then T10 (plugin-based).
T9 — Root `TODO.md` with S5, S6, S7, S9, S10, S11. Spec: S5-S11. Commit: 6fb9e7e.
T10 — Replace the test-based export with `springdoc-openapi-maven-plugin` and the `openapi` H2 profile. Spec: S16, S17.
T11 — Remove `src/test` and `spring-boot-starter-test`. Spec: S16.

## Evidence

- `./mvnw test` → 15 tests, 0 failures (`FamousEnumContractTest` 3, `CaptureControllerTest` 6, `OpenApiContractTest` 6).
- `./mvnw -DskipTests package` → jar built.
- App booted on :18080 (H2 in place of Postgres, `spring.docker.compose.enabled=false`):
  `/v3/api-docs` 200 (31025 bytes), `/v3/api-docs.yaml` 200, `/swagger-ui.html` 200,
  `/swagger-ui/index.html` 200, `/famous` 200, `/captures/me` without token 401 with `ErrorDTO`,
  `POST /captures/create` with an empty body 415.
- Postgres from `docker-compose.yaml` was not running, so the boot check used H2 with
  `MODE=PostgreSQL`. The database engine does not affect the generated document.

## Log

L1 (user, verbatim):
"Necesito que te cambies de rama, y que empecemos a hacer la documentacion del proyecto con swagger y openapi. Haz una planificación cmpleta, y pregunta todo lo que no entiendas del proyecto."

L2 (user answers, verbatim):
"A. Sigue tu recomendacion
B. Sigue tu recomendación
C. Solo rest java, quiero poder obtener un archivo openapi.json, por lo que de momento haz los controllers solo
D. Documentar de momento
E. Esto está asi para facilitar las pruebas en desarrollo. Lo cambiaremos en las versiones finales.
F. Deja un TODO en la raiz del proyecto con ese cambio
G. Deja un TODO en la raiz del proyecto con ese cambio
H. Crea los endpoints y documentalos
I. No, metelo en el TODO de a raiz del proyecto
J. Documentalo como esta ahora mismo y anotalo en el TODO de la raiz
K. Solucionalo de la forma mas apropiada posible, y anotalo en el TODO
L. Normaliza todo
M. Manten el estandar
N. Siempre expuesto
O. Documenta en español"

L3 (orchestrator decision): multipart flattened. The JSON `data` part is gone; `image` (binary) and
`name` (text) are plain parts. `CaptureCreateRequest` stays as the internal carrier the service
consumes, and the controller builds it from the `name` part.

L4 (orchestrator decision): enum normalization is applied at the JSON boundary only
(`@JsonValue`/`@JsonCreator`), so persisted values and the database stay unchanged; query parameters use a
case-insensitive `Converter`.

L5 (orchestrator decision): the first attempt used `@Valid @ModelAttribute CaptureCreateRequest` on the
multipart endpoints. springdoc rendered it as a nested `request` object, exactly the shape the change
was meant to remove, so the endpoints now take `@RequestPart("name") @NotBlank String name`.
`GlobalExceptionHandler` gained a `HandlerMethodValidationException` handler so that method validation
still answers `400 validation failed` with the same `ErrorDTO` and `details` shape.

L6 (observation): springdoc 3.2.0 derives one schema per Jackson view, so the document contains
`UserResponse_Basic` and `UserResponse_Full` (and `ErrorDTO_Basic` / `ErrorDTO_Full`). It is accurate, so
it is kept and the contract test accepts the `_Basic` / `_Full` suffixes.

L7 (orchestrator decision): `PUT` and `PATCH /users/{id}` were split into two handler methods sharing one
service call. Behaviour is unchanged; without the split springdoc emits two operations with the same
`operationId`, which is invalid for client generation. Both are documented as full replacement (S10).

L8 (orchestrator decision): `docs/openapi.json` is written by `OpenApiContractTest` to
`../docs/openapi.json` (overridable with `-Dopenapi.export.path`). The same test asserts the exported
file matches the document served at `/v3/api-docs`.

L9 (evidence, historical): suite `./mvnw test` = 15 tests, 0 failures. No longer applicable: the
suite was removed by S16.

L10 (user, verbatim): "No quiero nada de testing. Además, el error numero 6, de aplanar el multipart
en captures, quiero dejarlo como TODO. No hagas cambios, lo quiero meter todo en una rama de errores
logicos en el futuro."

L11 (user, verbatim, answering the scope questions): "No quiero ningun tipo de testing excepto lo
únicamente necesario para que la documentación funcione. El resto de codigo no quiero testearlo. Ni en
esta, ni en ninguna rama. En la proxima rama quiero hacer los cambios que vamos a dejar en el TODO
(errores logicos y todo eso)" / "Plugin de springdoc en el build".

L12 (orchestrator decision): with the plugin owning generation, no test code is "necesario para que la
documentación funcione", so `src/test` and `spring-boot-starter-test` are gone. The plugin boots a
dedicated `openapi` Spring profile backed by in-memory H2 on port 18080, so `./mvnw verify` needs neither
the docker-compose Postgres nor the gRPC service.

L13 (orchestrator decision): restoring the original multipart shape also dropped the explicit
`consumes = multipart/form-data` on both POST mappings, and springdoc then documented them as
`application/json` with a binary `image` field. `consumes` is request-mapping metadata, not logic, so it
is declared again to keep the document truthful; the multipart body keeps the `data` JSON part.
