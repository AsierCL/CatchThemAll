# OpenAPI documentation update after the post-documentation contributions

Branch: `docs/openapi-update`. Base: `main` @ `bb2077a`.
Scope: bring `docs/openapi.json` back in line with the API after the contributions that landed between
`780d282` (the squash merge of the first documentation round) and `bb2077a`.

## Specs

S1 — Request: "Como puedes ver, se han hecho varias contribuciones al repositorio despues de documentarlo
nosotros. Revisa todo lo que se ha introducido, y documentalo siguiendo el workflow anterior, es decir,
cambiandote de rama, y trabajando en un arama docs".

S2 — Inherited from the first round: "Documenta en español" → `info`, `summary`, `description` and
`@Schema(description)` stay in Spanish.

S3 — Inherited: "No quiero ningun tipo de testing excepto lo únicamente necesario para que la documentación
funcione" + "Plugin de springdoc en el build" → no test code; `docs/openapi.json` is produced by
`springdoc-openapi-maven-plugin` during `./mvnw verify`.

S4 — Inherited: "Documentar de momento" → the document describes the behaviour that exists today. Every
defect found while documenting is recorded in `TODO.md`, never fixed in this branch.

S5 — Inherited: "Manten el estandar" → the versioned artifact stays at `docs/openapi.json`.

S6 — Inherited: "Normaliza todo" → enum values keep travelling in lowercase; the existing
`@JsonValue`/`@JsonCreator` and the case-insensitive converter stay untouched.

S7 — What entered the API since `780d282`, and therefore has to be documented: `POST /auth/refresh` with
refresh-token rotation, `refreshToken` in `TokenResponse`, `PUT /users/me` and `PATCH /users/me` with
`application/json-patch+json`, the flattened multipart of the capture endpoints, the ownership check on
capture identification, and the ordered `GET /famous` without filters.

S8 — Second entry, PR #11 ("feat:caffeine cache for usual GET"): the branch is rebased onto the new `main`
and the new observable behaviour is documented too. Server-side caches (`famous` 24 h, `ranking` 1 h,
`captures` 15 min), `ETag` plus `304 Not Modified` through `ShallowEtagHeaderFilter`, and the score
awarded on a first capture.

## Tasks

T1 — Create branch and tracking. Spec: S1. Commit: tracked with the work units.
T2 — Document `POST /auth/refresh`, `RefreshRequest` and `TokenResponse.refreshToken`. Spec: S2, S7. Commit: 0926002.
T3 — Fix the capture documentation: parts are `image` + `name` on identify and `image` + `data` on create,
and identify now requires ownership. Spec: S4, S7. Commit: 4cc603d.
T4 — Replace the stale `replaceUser` block with `PUT /users/me` and add `PATCH /users/me` (JSON Patch).
Spec: S2, S7. Commit: 6d62df9.
T5 — Correct `UserPutUpdateRequest` (PATCH no longer shares its body) and document the ownership rejection.
Spec: S4, S7. Commit: 6d62df9.
T6 — Regenerate `docs/openapi.json`. Spec: S3, S5. Commit: 38b52e7.
T7 — Refresh `TODO.md`: drop what the contributions resolved, record what they introduced. Spec: S4.
Commit: 38b52e7.
T8 — README: document the refresh flow and the JSON Patch content type. Spec: S2. Commit: 38b52e7.

## Log

L1 (user, verbatim):
"Como puedes ver, se han hecho varias contribuciones al repositorio despues de documentarlo nosotros. Revisa todo lo que se ha introducido, y documentalo siguiendo el workflow anterior, es decir, cambiandote de rama, y trabajando en un arama docs"

L2 (orchestrator: what the diff `780d282..bb2077a` introduced): refresh tokens (`RefreshToken` entity,
`RefreshTokenService`, `POST /auth/refresh`), JSON Patch profile update (`zjsonpatch` dependency,
`PUT`/`PATCH /users/me`), ownership checks in `CaptureController.identify` and `UserController.removeFriend`,
the capture multipart finally flattened to `image` + `name`, `UserUpdateRequest` renamed to
`UserPutUpdateRequest`, `@NotBlank` removed from `FriendRequest.friendId`, the null-safe message in
`GlobalExceptionHandler`, ordered `GET /famous`, `jwt.refreshExpirationMs`, and the deletion of the
standalone Python test script.

L3 (orchestrator decision): where the new handlers contradict the path they are mapped to, the document
describes what a client can actually send, not the broken signature, and the defect goes to `TODO.md`.

L4 (decision): the ownership rejection is documented as `500`, not `403`. `GlobalExceptionHandler` catches
`org.springframework.security.access.AccessDeniedException`, while the controllers throw
`java.nio.file.AccessDeniedException`; the mismatch was confirmed by reading both imports and by a live
call. `TODO.md` item 3 records the intent-versus-reality gap.

L5 (user request, verbatim): "Acaban de aceptar una PR en main. Traete los cambios y documentalos tambien
antes de mergear nuestra rama".

L6 (orchestrator): the branch was rebased onto `origin/main` (`51ee101`, PR #11) instead of merging, because
the branch had not been pushed, so it stays linear and reviewable. The rebase applied without conflicts.
The new behaviour is documented rather than ignored: a cache is invisible in the schema but very visible to
a client, so the staleness window of each cached read and the `ETag`/`304` negotiation are stated in the
`info.description` and in the affected operations, and the score awarded on a first capture is documented
in `identifyFamous`, `getRanking` and `UserResponse.score`.

L7 (user request, verbatim): "Endurece los @value , dejalo todo listo, y luego mergeamos". Every `@Value`
that would turn a missing property into a startup failure now carries the default that
`application.properties` already sets, so the context keeps booting with an overridden configuration
location: `cache.*.ttl` (the three this branch moved out of code), plus `security.jwt.expiration-minutes`
and `jwt.refreshExpirationMs`, which already had the problem before this branch. With the properties
present nothing changes.

## Evidence

- `./mvnw clean verify` -> BUILD SUCCESS; `docs/openapi.json` regenerated with 16 paths and 21 operations,
  `info.version` sourced from `build-info`, `/auth/refresh` present, `PUT`/`PATCH /users/me` with an empty
  parameter list (the phantom path variable is hidden), and the two capture bodies showing
  `image`+`name` and `image`+`data` as plain parts.
- Live checks against the packaged jar on port 18080 with the `openapi` profile (H2):
  - `POST /auth/register` -> 200 with `token`, `refreshToken`, `tokenType`, `expiresIn`.
  - `GET /users/me` with the token -> 200.
  - `PUT /users/me` -> 500 and `PATCH /users/me` -> 500 (documented exactly as such).
  - `PATCH /users/me` with `application/json` -> 415 (the mapping requires `application/json-patch+json`).
  - `POST /auth/refresh` with the issued token -> 200 and a different refresh token (rotation works).
  - Reusing the rotated token -> 404; an unknown token -> 404.
- Engram mirror: the `mem_save` call was rejected by the runtime contract
  (`expected engram.pi-http-runtime/v1`, HTTP 404), so the `odd/<feature>/tasks` mirror does not exist for
  this feature. Only the file above holds the tracking.
- Second round, after rebasing onto `51ee101`: `./mvnw clean verify` -> BUILD SUCCESS and
  `docs/openapi.json` keeps 16 paths and 21 operations, now carrying the cache section in
  `info.description` and the staleness window in `GET /famous`, `GET /users/ranking` and `GET /captures/me`.
- Live checks of the HTTP cache contract on port 18080: `GET /famous` answers `200` with
  `ETag: "0d75..."` and `Cache-Control: no-cache, no-store, max-age=0, must-revalidate`; the same request
  with `If-None-Match` answers `304`; `GET /users/ranking` also carries an `ETag`.
- Final round: every `@Value` in the tree has a default, so no missing property can stop the context from
  starting. `./mvnw clean verify` green and the regenerated document unchanged in shape (16 paths, 21
  operations), with the cache windows printed from the properties.
