# TODO — pendientes acordados

Registro de los problemas conocidos de la API que quedaron fuera del trabajo de documentación
OpenAPI (`docs/openapi.json`). La documentación describe el comportamiento actual, incluidas las
inconsistencias listadas acá.

Cuando se resuelva cualquiera de estos puntos hay que regenerar `docs/openapi.json` con
`./mvnw verify` (ver `README.md`) y revisar si cambia el alcance de los endpoints en
`config/OpenApiConfig.java`.

## Pendientes

### 1. El filtro de seguridad deja pasar todas las peticiones

`SecurityConfig.securityFilterChain` sigue con `.anyRequest().permitAll()`. Está así a propósito para
facilitar las pruebas en desarrollo y se va a cambiar en las versiones finales.

Estado en la documentación: `bearerAuth` está declarado y las operaciones que resuelven el usuario
autenticado lo marcan como requerido (`GET /users/me`, `PUT`/`PATCH /users/me`,
`DELETE /users/{id}/friends/{friendId}`, `POST /captures/{id}/identify`, `GET /captures/me` y
`GET /captures/me/{captureId}`), pero el servidor no rechaza una petición sin token en las que no
tocan al usuario autenticado.

### 2. `PUT` y `PATCH /users/me` no pueden resolver el `id` que declaran

Los dos handlers reciben `@PathVariable UUID id`, pero la ruta mapeada es `/users/me` y no tiene
variable. Spring falla al resolver el argumento antes de ejecutar el método, así que **toda** petición
a `PUT /users/me` y `PATCH /users/me` termina en `500`, con token válido o sin él.

Qué falta: decidir el contrato — quitar el `@PathVariable` y usar
`currentUserService.getCurrentUserId()`, o mover los endpoints a `/users/{id}`. Es el bug más caro de
los que quedan: hoy la edición de perfil no funciona por ninguna vía.

En la documentación el parámetro está oculto (`@Parameter(hidden = true)`) para que Swagger UI pueda
enviar la petición, y la operación documenta `500`.

### 3. El rechazo por propiedad devuelve `500` en lugar de `403`

`CaptureController.identify`, `UserController.putUpdate`, `UserController.patchUpdate` y
`UserController.removeFriend` lanzan `java.nio.file.AccessDeniedException`, pero
`GlobalExceptionHandler` captura `org.springframework.security.access.AccessDeniedException`. Son
clases distintas: la excepción cae en el handler genérico y responde `500 unexpected error`.

Qué falta: usar la excepción de Spring Security (o una propia) y documentar `403`.

### 4. Los partes de texto multipart no se validan como entrada

`identify` usa `@RequestPart("name") @NotBlank @NotNull String` y `create` usa lo mismo sobre
`@RequestPart("data")`. La validación de esas anotaciones produce
`HandlerMethodValidationException`, que ningún `@ExceptionHandler` captura, así que un valor vacío
responde `500` en lugar de `400`.

Qué falta: añadir el handler de `HandlerMethodValidationException` en `GlobalExceptionHandler`
(devolviendo `400 validation failed` con `details`, como el resto de las validaciones).

### 5. El parte de texto de `create` se llama `data` y el de `identify` se llama `name`

`POST /captures/create` espera `image` + `data`, y `POST /captures/{id}/identify` espera
`image` + `name`. Son el mismo concepto con dos nombres, y en `create` el nombre `data` sugiere un
JSON que no existe: es texto plano.

Qué falta: unificar en `name`.

### 6. `captured` se calcula antes de persistir

En `CaptureServiceImpl.identify` el campo `captured` se resuelve con
`captureRepository.findByCaptureFamousAndUser(...)` antes de guardar la captura nueva, así que la
primera captura de un famoso siempre devuelve `false`.

Qué falta: decidir la semántica y el nombre del campo. Si significa "ya la tenía antes de esta
petición", el cálculo es correcto pero el nombre engaña; si significa "quedó capturado", hay que
recalcularlo después del `save`.

Relacionado: no existe restricción de unicidad, así que se acumulan capturas repetidas del mismo
famoso por el mismo usuario.

### 7. Unificar la resolución case-insensitive de enums

La misma política (recortar espacios, comparar sin distinguir mayúsculas, rechazar lo desconocido)
está implementada tres veces: en `FamousCategories.fromValue`, en `FamousTypes.fromValue` y en
`EnumConversionConfig.CaseInsensitiveEnumConverter`. Si cambia la semántica hay que tocar los tres
lugares.

### 8. `DELETE /users/{id}` no verifica el dueño del perfil

A diferencia de `PUT`, `PATCH` y `DELETE /users/{id}/friends/{friendId}`, el borrado de cuenta no
compara el path con el usuario del token: cualquiera puede eliminar la cuenta de otro.

### 9. Los refresh tokens se guardan en claro y se acumulan

`RefreshToken.token` es un `UUID.randomUUID()` persistido sin hashear, y cada `login` o `register`
crea uno nuevo sin borrar los anteriores del mismo usuario. Se rotan al usarse
(`POST /auth/refresh` borra el viejo), pero un usuario que inicia sesión muchas veces acumula filas
válidas durante 24 horas.

Qué falta: decidir si se hashea el token en la base y si el login debe invalidar los anteriores.

### 10. `RefreshRequest` declara validaciones que nunca se ejecutan

`AuthController.refreshToken` recibe `@RequestBody RefreshRequest request` sin `@Valid`, así que
`@NotNull` y `@NotBlank` sobre `refreshToken` no corren nunca. Un cuerpo con `refreshToken` nulo
termina en `404` en lugar de `400`.

### 11. Restos sin uso

- `presentation/dto/CaptureCreateRequest.java` quedó **vacío** (0 bytes) desde que el multipart se
  aplanó y el servicio recibe un `String`.
- `presentation/dto/CaptureCreateResponse.java` es un DTO vacío que ningún endpoint devuelve.
- `FamousRepository` conserva consultas sin uso (`findAllByOrderByPokedexNumberAsc` ya se usa, pero
  `findByType`, `findByCategory` y compañía quedaron sueltas).

### 12. La cache de `GET /famous` congela las estadisticas 24 horas

`FamousServiceImpl.findAll` esta anotado con `@Cacheable(cacheNames = "famous")` y esa cache expira a
las 24 horas, sin ningun `@CacheEvict` asociado. El problema es que la respuesta incluye
`captureCount` y `collectorCount`: despues de la primera lectura, el catalogo muestra conteos
congelados durante un dia entero, aunque entren capturas nuevas.

### 13. La cache de `GET /captures/me` no se invalida al registrar una captura

`CaptureServiceImpl.findMine` usa `@Cacheable(cacheNames = "captures", key = "#userId")` con 15
minutos de vigencia. Ninguna escritura la invalida, asi que tras `POST /captures/{id}/identify` el
historial propio puede seguir sin mostrar la captura recien creada durante ese lapso. La cache de
`ranking` si se limpia (`ScoreServiceImpl.updateScore` tiene `@CacheEvict`), lo que hace la
inconsistencia todavia mas visible: el ranking sube y el historial no.

### 14. El puntaje se actualiza con un `@Modifying` sin transaccion

`UserRepository.updateScore` es una consulta `@Modifying` y `ScoreServiceImpl.updateScore` no declara
`@Transactional`. La llamada ocurre dentro del callback `onSuccess` del futuro de gRPC, o sea fuera
de cualquier transaccion, asi que la actualizacion probablemente lance
`TransactionRequiredException`.

Peor: al ejecutarse dentro de `onSuccess`, la excepcion no completa el `CompletableFuture` que espera
el controlador, con lo que la peticion podria quedarse colgada hasta el timeout en lugar de devolver
un error.

Sin confirmar: hace falta el servicio gRPC levantado para llegar a ese camino. Es lo primero a mirar
cuando se arregle el resto.

### 15. Ruido de repositorio

- Hay seis archivos `.pyc` versionados bajo `FacialRecognition/src/capture_service/**/__pycache__/`,
  incluido el commit `e1376e7` ("meaningless archives") que solo actualiza binarios compilados.
  Deberian salir del control de versiones y agregarse al `.gitignore`.
- `application.properties` deja `logging.level.org.springframework.cache=TRACE`: en desarrollo esta
  bien, pero es un nivel muy verboso para cualquier otro entorno.

### 16. La ventana de cache esta escrita en prosa en tres lugares

Las duraciones de cada cache (24 h para `famous`, 1 h para `ranking`, 15 min para `captures`) viven en
`CacheConfig`, pero tambien estan copiadas en el `info.description` y en la descripcion de cada
operacion afectada. Si se ajusta un TTL en `CacheConfig`, la documentacion queda mintiendo y nada
falla para avisarlo.

Que falta: decidir donde vive el dato. O se inyectan los TTL como propiedades (`@Value` desde
`application.properties`) y la documentacion se arma con esos valores, o el documento deja de repetir
cifras y dice solo "se sirve desde cache" delegando el numero a `CacheConfig`.

Detectado por la revision de legibilidad (`R2-cache-ttl-prose-duplication`).

## Hallazgos de la revision `review-2c19a267d7e24677` sin texto adjunto

El cierre de esa revision aprobo el candidato pero no adjunto el texto de tres hallazgos, solo id,
lente, ubicacion y severidad. Quedan anotados para interpretarlos cuando se toque esa zona, no como
acciones decididas.

- `R3-001` (reliability, WARNING, `docs/openapi.json:1`): apunta al documento generado, no a una linea,
  asi que es una observacion sobre el artefacto completo.
- `R3-002` (reliability, WARNING, `CaptureController.java:64-66`): cae en el bloque de `identifyFamous`
  donde se documenta el puntaje por captura. Sospecha: objeta que el documento prometa puntos cuando la
  actualizacion del puntaje puede fallar (punto 14).
- `R3-003` (reliability, SUGGESTION, `OpenApiConfig.java:52-55`): cae en la frase de `ETag` y
  `Cache-Control: no-store` del `info.description`.

## Resuelto por las contribuciones posteriores a la primera documentación

Se dejan registrados para que no se reabran:

- `POST /captures/{id}/identify` ahora contrasta el `{id}` con el usuario del token (aunque el
  rechazo devuelva `500`, ver punto 3).
- `@NotBlank` sobre el `UUID` de `FriendRequest` fue eliminado: el endpoint de amistades dejó de
  romper con `500`.
- `PUT` y `PATCH` se separaron: `PATCH /users/me` recibe un documento JSON Patch real.
- El multipart de capturas se aplanó a partes simples (aunque el nombre del parte siga desparejo,
  ver punto 5).
- `GlobalExceptionHandler.handleResponseStatus` ya no puede construir un `ErrorDTO` con `message`
  nulo.
- `GET /famous` sin filtros ordena por `pokedexNumber`.
- `FacialRecognition/src/capture_service/mierda_test.py` fue eliminado.
- El cuerpo de `POST /auth/refresh` pide `refreshToken` y no `token`: el campo se renombro para que el
  nombre coincida con el de la respuesta y con el resto de la documentacion. Rompe a cualquier cliente
  que todavia mande `{"token": "..."}`.

## Cambios de contrato ya aplicados

### Valores de enum normalizados a minúsculas

`FamousCategories` y `FamousTypes` viajan por la API en minúsculas (`legendary`, `epic`, `rare`,
`common`, `politic`, `actor`, `writer`, `musician`, `teacher`, `meme`) y se aceptan sin distinguir
mayúsculas, tanto en el cuerpo JSON como en los query params de `GET /famous`.

La base de datos no cambió: sigue persistiendo el nombre de la constante (`Legendary`), porque la
normalización se aplica solo en el borde HTTP.
