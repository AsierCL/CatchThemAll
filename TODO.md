# TODO — pendientes acordados

Registro de los problemas conocidos de la API que quedaron fuera del trabajo de documentación
OpenAPI (`docs/openapi.json`). La documentación **describe el comportamiento actual**, incluidas las
inconsistencias listadas acá; cuando se resuelvan, hay que regenerar `docs/openapi.json` con
`./mvnw test` y actualizar `src/main/java/usc/enser/CatchThemAll/config/OpenApiConfig.java` si cambia
el alcance de los endpoints.

## Pendientes

### 1. El filtro de seguridad deja pasar todas las peticiones

`SecurityConfig.securityFilterChain` usa `.anyRequest().permitAll()`. Está así a propósito para
facilitar las pruebas en desarrollo y **se va a cambiar en las versiones finales**.

Estado en la documentación: el esquema `bearerAuth` está declarado y solo las operaciones que
resuelven el usuario autenticado (`GET /users/me`, `GET /captures/me`, `GET /captures/me/{captureId}`)
lo marcan como requerido.

Qué falta: definir las reglas reales por método y ruta, y revisar que `permitAll()` no quede en
producción.

### 2. `POST /captures/{id}/identify` no valida el dueño de la captura

El `{id}` del path se usa como identificador del usuario dueño de la captura, pero no se contrasta
con el `sub` del token: cualquiera puede registrar capturas a nombre de otro usuario.

Qué falta: mover el endpoint a `/captures/me/identify` (o derivar el usuario del token e ignorar el
path), y actualizar la documentación en consecuencia.

### 3. `captured` se calcula antes de persistir

En `CaptureServiceImpl.identify` el campo `captured` se resuelve con
`captureRepository.findByCaptureFamousAndUser(...)` **antes** de guardar la captura nueva, así que la
primera captura de un famoso siempre devuelve `false`.

Qué falta: decidir la semántica y el nombre del campo. Si significa "ya la tenía antes de esta
petición", el cálculo actual es correcto pero el nombre es engañoso; si significa "quedó capturado",
hay que recalcularlo después del `save`.

Relacionado: no existe restricción de unicidad, así que se acumulan capturas repetidas del mismo
famoso por el mismo usuario.

### 4. `@NotBlank` sobre un `UUID` rompe la validación

`FriendRequest.friendId` es de tipo `UUID` y está anotado con `@NotNull` **y** `@NotBlank`.
Hibernate Validator no tiene validador para `@NotBlank` sobre `UUID`, por lo que toda petición a
`POST /users/{id}/friends` termina en `500` en lugar de `400`.

Qué falta: quitar `@NotBlank` y dejar solo `@NotNull`.

### 5. `PUT` y `PATCH /users/{id}` tienen la misma semántica

Ambas operaciones comparten el mismo servicio y un cuerpo cuyos tres campos son obligatorios
(`@NotNull` en `name`, `description` y `photoUrl`), de modo que `PATCH` **no** es una actualización
parcial: reemplaza el perfil completo.

Estado en la documentación: se documenta tal cual, con una nota explícita en la operación
`patchUser`.

Qué falta: decidir si `PATCH` acepta campos opcionales (con un DTO propio y actualización parcial
real) o si se elimina y queda solo `PUT`.

## Cambios de contrato ya aplicados en esta rama

Estos ya están hechos, pero rompen compatibilidad con clientes anteriores:

### 6. Multipart de capturas aplanado

`POST /captures/create` y `POST /captures/{id}/identify` ya no reciben un parte `data` con un JSON
anidado. Ahora son dos partes simples de `multipart/form-data`:

- `image`: archivo binario, obligatorio.
- `name`: texto, obligatorio.

Motivo: el parte JSON anidado no se puede componer desde Swagger UI ni desde la mayoría de los
clientes HTTP. La validación de `name` se hace con `@NotBlank` sobre el parte y se reporta como
`400 validation failed`, con el mismo esquema `ErrorDTO` de siempre.

### 7. Valores de enum normalizados a minúsculas

`FamousCategories` y `FamousTypes` viajan por la API en minúsculas (`legendary`, `epic`, `rare`,
`common`, `politic`, `actor`, `writer`, `musician`, `teacher`, `meme`) y se aceptan sin distinguir
mayúsculas, tanto en el cuerpo JSON como en los query params de `GET /famous`.

La base de datos **no** cambió: sigue persistiendo el nombre de la constante (`Legendary`), porque la
normalización se aplica solo en el borde HTTP.

## Otros hallazgos (no acordados, sin cambios)

- `PUT`/`PATCH` y `DELETE /users/{id}` no verifican que el usuario autenticado sea el dueño del
  perfil.
- `CaptureCreateResponse` es un DTO vacío y sin uso.
- `GlobalExceptionHandler.handleResponseStatus` puede construir un `ErrorDTO` con `message` nulo
  cuando la excepción no trae `reason` (`throw new ResponseStatusException(status)`).
- `GET /famous` sin filtros devuelve los famosos sin orden definido; las variantes filtradas sí
  ordenan por `pokedexNumber`.
