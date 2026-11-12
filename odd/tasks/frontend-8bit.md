# Frontend web 8-bit para CatchThemAll

Branch: `feat/frontend-8bit`. Base: `main` @ `b0237f2`. Todo el trabajo vive en `Frontend/`; no se toca
el backend.

## Specs

S1 — "Quiero que diseñes la página web que de soporte a esta aplicación, ya que mis usuarios no van a
interactuar con el backend." → la web cubre el recorrido completo del usuario final sobre `docs/openapi.json`:
registro, login, catálogo de famosos, captura por foto, historial propio, ranking, amistades y perfil. Ninguna
pantalla exige al usuario conocer rutas, headers ni Swagger.

S2 — "Quiero un estilo 8bit que recuerde a los pokemons antiguos, pero sin ser demasiado cantoso." →
pixel art de bajo contraste: bordes duros de 2px, sombras sin blur, tipografía pixel solo en títulos y
etiquetas, cuerpo legible; animaciones cortas y discretas; nada de arcoíris ni destellos constantes. La
paleta concreta la define S8.

S3 — "Puedes usar el siguiente stack: React + Vite + TypeScript + Tailwind CSS + Axios" → solo ese stack
más lo mínimo imprescindible (router, tipografías locales). Sin framework de estado externo.

S4 — "Trabaja en una rama a parte, y mete todo el fontend en una carpeta llamada Frontend/, aqui en la raiz
del proyecto." → rama `feat/frontend-8bit`; raíz de la app en `Frontend/`.

S5 — "No quiero que commitees nada ni que pushees nada, itera hasta tener una versión funcional, y luego yo
lo revisaré." → **cero commits y cero push**. Los work-units de ODD quedan sin commit por instrucción
explícita del usuario; la evidencia de cada tarea es el archivo modificado y su verificación.

S6 — "Trabaja de forma autónoma, todas las preguntas importantes hazmelas antes de empezar" → las cuatro
decisiones de producto se resolvieron antes de escribir código; el resto de elecciones son reversibles y se
documentan en `Frontend/README.md`.

S7 — Respuestas a esas cuatro preguntas:
- Edición de perfil: "De momento trabaja como si funcionara. Eses cambios se arreglarán en el futuro" → la UI
  de edición se implementa completa (PUT y PATCH) sin carteles que la declaren rota; el error 500 del backend
  se muestra como un error normal.
- `POST /captures/create`: "Fuera del alcance" → no hay panel de carga de muestras.
- "Archivo + cámara del dispositivo" → la captura acepta subida de archivo y cámara vía `getUserMedia`.
- "No, solo API real" → no hay modo demo ni datos mock embebidos en la app.

S8 — "Bien. Quiero que cambies un poco el esquema de color. Quiero que recuerde mucho mas al de pokemon, es
decir, mas blanco y rojo (como guideline, no tienen que ser exclusivos)" → el esquema pasa de nocturno a
papel blanco cálido con rojo Pokédex como acento principal; el rojo queda reservado a acciones primarias,
estados activos y marca, y el resto se resuelve con tinta y grises cálidos. Los colores de estado y de
rareza/tipo se retonan para tener contraste sobre fondo claro. Refina S2, que sigue vigente en sus formas.

## Tasks

T1 — Rama y tracking ODD. Spec: S4, S5. **Hecho** (sin commit por S5).
T2 — Andamiaje Vite + React + TS + Tailwind + Axios + router, proxy `/api` → `localhost:8080`, tipografías
   pixel empaquetadas, tokens de tema. Spec: S2, S3, S4. **Hecho.**
T3 — Capa API: tipos derivados de `docs/openapi.json`, cliente axios con Bearer, refresh single-flight,
   mapeo de `ErrorDTO` a mensajes accionables. Spec: S1, S3. **Hecho.**
T4 — Autenticación: registro, login, bootstrapping, rutas protegidas, cierre de sesión. Spec: S1. **Hecho.**
T5 — Sistema visual 8-bit y layout: botones, tarjetas, insignias de rareza/tipo, inputs, modal, toasts,
   barras de similitud, nav y footer. Spec: S2. **Hecho.**
T6 — Pokédex: grilla de famosos con filtros y búsqueda, y ficha de detalle con estadísticas. Spec: S1, S2.
   **Hecho.**
T7 — Captura: selección de famoso, subida o cámara, resultado con similitud y puntos, errores 413/422/503/504.
   Spec: S1, S2, S7. **Hecho.**
T8 — Mi Pokédex: historial de capturas propias. Spec: S1. **Hecho.**
T9 — Ranking de cazadores. Spec: S1. **Hecho.**
T10 — Amistades: listado, búsqueda de usuarios, alta, baja y perfil del amigo. Spec: S1. **Hecho.**
T11 — Perfil propio: vista completa, edición (PUT y PATCH) y baja de cuenta. Spec: S1, S7. **Hecho.**
T12 — Home de bienvenida y 404 en el estilo del sitio. Spec: S2. **Hecho.**
T13 — Verificación: typecheck, build, lint y e2e con Playwright contra backend real. Spec: S1, S5. **Hecho**
   (evidencia en L6).
T14 — `Frontend/README.md`: puesta en marcha, proxy/CORS, variables, decisiones y limitaciones conocidas del
   backend. Spec: S3, S5, S7. **Hecho.**
T15 — Migrar el esquema de color a papel blanco + rojo Pokédex: tokens `paper`/`ink`/`poke`, retono de rarezas,
   tipos y estados, favicon, `theme-color` y documentación de estilo. Spec: S8. **Hecho** (evidencia en L9).

## Log

L1 — "Hola. Estas en el directorio de un proyecto de un backend de una aplicación API en springboot. La app
algo similar a un PokemonGo, pero con famosos. Puedes ver su estructura y su documentación en
@docs/openapi.json / Quiero que diseñes la página web que de soporte a esta aplicación, ya que mis usuarios no
van a interactuar con el backend. / Quiero un estilo 8bit que recuerde a los pokemons antiguos, pero sin ser
demasiado cantoso. / Puedes usar el siguiente stack: React + Vite + TypeScript + Tailwind CSS + Axios /
Trabaja en una rama a parte, y mete todo el fontend en una carpeta llamada Frontend/, aqui en la raiz del
proyecto. No quiero que commitees nada ni que pushees nada, itera hasta tener una versión funcional, y luego
yo lo revisaré. / Trabaja de forma autónoma, todas las preguntas importantes hazmelas antes de empezar"

L2 — Decisiones previas (4 preguntas): perfil editable como si el backend funcionara; `/captures/create`
fuera de alcance; captura por archivo y cámara; sin modo demo, solo API real.

L3 — Hallazgo de entorno: `SecurityConfig` no define CORS. La app se sirve en `localhost:5173` con proxy de
Vite hacia `localhost:8080`, de modo que el navegador nunca hace una petición cross-origin y no hay que tocar
el backend. Queda documentado en `Frontend/README.md`.

L4 — Verificación con backend real aislado: Postgres temporal (`ctall-e2e-pg`, puerto 7799) y la API en el
puerto 8081 con `--spring.datasource.*` apuntando a esa base, porque el 8080 del host está ocupado por otro
contenedor. La base de desarrollo del usuario (7777) quedó sin relaciones: no se escribió nada en ella. El
catálogo se sembró con 12 famosos de prueba en la base temporal. `docs/openapi.json` no trae filtro por
nombre para `GET /famous`, así que la búsqueda del catálogo se resuelve en cliente sobre la respuesta
filtrada por tipo y rareza.

L5 — Defectos propios encontrados por el e2e y corregidos: (a) `aria-label` redundante en el buscador del
catálogo pisaba el nombre accesible del label real; (b) el hook local `useImage` de la captura violaba
`rules-of-hooks` al llamarse desde handlers, renombrado a `applyImage`; (c) el contador de resultados quedaba
pegado al borde del buscador; (d) el buscador de amigos se llamaba "Nombre de cazador" y se unificó como
"Buscar cazador"; (e) el panel de la ficha estiraba su altura por la columna lateral (`items-start`).

L6 — Verificación final (todas ejecutadas en esta sesión):
- `cd Frontend && npx tsc -b` → sin salida, exit 0.
- `cd Frontend && npm run build` → `✓ built in 611ms`, `dist/assets/index-*.js 413.48 kB` (126.44 kB gzip).
- `cd Frontend && npx oxlint` → 0 errores, 8 warnings de estilo (`set-state-in-effect`, `only-export-components`,
  `purity` por `new Date()` en registro).
- e2e Playwright (chromium del sistema, guion fuera del repo en `/tmp/ctall-e2e`) → **18/18 comprobaciones
  OK, 0 fallos**: home, registro real contra la API, catálogo (12 fichas), filtro por rareza (2 legendarios),
  búsqueda por nombre (1 resultado), ficha, captura con famoso preseleccionado por `?famoso=`, resultado de
  similitud (93 %), historial vacío y con captura, ranking con 11 filas, segundo usuario, alta de amistad,
  error 500 de `PUT /users/me` mostrado sin romper la pantalla, 404 propio y cero errores de runtime.
- La interceptión de red solo se usó para `POST /captures/{id}/identify` y `GET /captures/me` (el servicio
  gRPC de reconocimiento no está levantado); todo lo demás fue contra la API real con JWT real.

L7 — Observado y no modificado (backend, fuera de alcance): la cache de `GET /users/ranking` (1 h) y la de
`GET /famous` (24 h) no se invalidan al escribir, así que dos corridas seguidas del e2e ven listados
congelados. La UI lo aclara con una nota en cada pantalla afectada; el e2e se reejecutó con la cache fría.

L8 — "Bien. Quiero que cambies un poco el esquema de color. Quiero que recuerde mucho mas al de pokemon, es
decir, mas blanco y rojo (como guideline, no tienen que ser exclusivos)" → cambio de esquema pedido por el
usuario después de la primera entrega.

L9 — Ejecución del cambio de paleta: se renombraron los tokens en todo `src/` (`night-*` → `paper-*`,
`mist-*` → `ink-*`, `mint-*` → `poke-*`) para que los nombres digan la verdad, se retonaron rarezas, tipos,
estados y sombras para fondo claro, se pasó el fondo del documento a `paper-50`, se agregó la franja roja de
3px en header/footer y se actualizaron `favicon.svg`, `theme-color` y `README.md`. El rojo (`#d32f2f`) queda
reservado a acciones primarias, estados activos y marca; éxito usa verde hoja, error rose, info azul acero.

L9.1 — Verificación de la paleta: `npx tsc -b` limpio, `npm run build` verde (`index-*.js 413.41 kB`), `npx
oxlint` sin errores y e2e Playwright **18/18 comprobaciones OK** contra la API real. Las 14 capturas de
pantalla (`/tmp/ctall-e2e/shots`) se revisaron una por una para confirmar contraste de texto, insignias,
botones deshabilitados, modal y toasts sobre fondo claro.
