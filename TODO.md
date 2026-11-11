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

### 10. Restos sin uso

- `presentation/dto/CaptureCreateRequest.java` quedó **vacío** (0 bytes) desde que el multipart se
  aplanó y el servicio recibe un `String`.
- `presentation/dto/CaptureCreateResponse.java` es un DTO vacío que ningún endpoint devuelve.
- `FamousRepository` conserva consultas sin uso (`findAllByOrderByPokedexNumberAsc` ya se usa, pero
  `findByType`, `findByCategory` y compañía quedaron sueltas).

### 11. La cache de `GET /famous` congela las estadisticas 24 horas

`FamousServiceImpl.findAll` esta anotado con `@Cacheable(cacheNames = "famous")` y esa cache expira a
las 24 horas, sin ningun `@CacheEvict` asociado. El problema es que la respuesta incluye
`captureCount` y `collectorCount`: despues de la primera lectura, el catalogo muestra conteos
congelados durante un dia entero, aunque entren capturas nuevas.

### 12. La cache de `GET /captures/me` no se invalida al registrar una captura

`CaptureServiceImpl.findMine` usa `@Cacheable(cacheNames = "captures", key = "#userId")` con 15
minutos de vigencia. Ninguna escritura la invalida, asi que tras `POST /captures/{id}/identify` el
historial propio puede seguir sin mostrar la captura recien creada durante ese lapso. La cache de
`ranking` si se limpia (`ScoreServiceImpl.updateScore` tiene `@CacheEvict`), lo que hace la
inconsistencia todavia mas visible: el ranking sube y el historial no.

### 13. El puntaje se actualiza con un `@Modifying` sin transaccion

`UserRepository.updateScore` es una consulta `@Modifying` y `ScoreServiceImpl.updateScore` no declara
`@Transactional`. La llamada ocurre dentro del callback `onSuccess` del futuro de gRPC, o sea fuera
de cualquier transaccion, asi que la actualizacion probablemente lance
`TransactionRequiredException`.

Peor: al ejecutarse dentro de `onSuccess`, la excepcion no completa el `CompletableFuture` que espera
el controlador, con lo que la peticion podria quedarse colgada hasta el timeout en lugar de devolver
un error.

Sin confirmar: hace falta el servicio gRPC levantado para llegar a ese camino. Es lo primero a mirar
cuando se arregle el resto.

### 14. Ruido de repositorio

- Hay seis archivos `.pyc` versionados bajo `FacialRecognition/src/capture_service/**/__pycache__/`,
  incluido el commit `e1376e7` ("meaningless archives") que solo actualiza binarios compilados.
  Deberian salir del control de versiones y agregarse al `.gitignore`.
- `application.properties` deja `logging.level.org.springframework.cache=TRACE`: en desarrollo esta
  bien, pero es un nivel muy verboso para cualquier otro entorno.

### 15. `main` lleva un commit sin revisar y una revision que no cerro

El ultimo commit de `main` (`78a07c0`, el endurecimiento de los `@Value`) se mergeo sin pasar por
revision. La revision anterior de la rama cerro como `escalated` con un hallazgo severo (`R3-001`) cuyo
texto nunca se expuso: solo se sabe que era de la lente de confiabilidad y que la causalidad quedo
indeterminada.

Que falta: decidir si ese estado se acepta o si se re-revisa el rango `51ee101..78a07c0` cuando se abra
la rama de errores, que es donde se toca `CacheConfig` de todos modos.
