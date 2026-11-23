# Frontend — CatchThemAll

Aplicación web para los usuarios finales de CatchThemAll: la Pokédex de famosos. Cubre el recorrido completo
sobre la API REST de `docs/openapi.json` —registro, login, catálogo, captura por reconocimiento facial,
historial propio, ranking, amistades y perfil— sin que nadie tenga que tocar Swagger.

- **Stack:** React 19 + Vite + TypeScript + Tailwind CSS 4 + Axios. Tests con Vitest y Testing Library.
- **Estilo:** 8-bit sobrio, inspirado en las Pokédex de consola: papel blanco cálido, rojo de consola para
  acciones y acentos, bordes de 2px, sombras duras y tipografía pixel solo en títulos y etiquetas.

## Puesta en marcha

Requisitos: Node.js 20+ y el backend de CatchThemAll corriendo.

```bash
# 1. Backend (otra terminal, desde la raíz del repo)
cd CatchThemAll
docker compose up -d postgres
./mvnw spring-boot:run            # API en http://localhost:8080

# 2. Frontend
cd Frontend
npm install
npm run dev                       # http://localhost:5173
```

Si el backend no está levantado, la web arranca igual pero cada pantalla muestra su estado de error; no hay
modo demo ni datos mock embebidos.

## Por qué hay un proxy

`CatchThemAll/config/SecurityConfig.java` no configura CORS. En lugar de modificar el backend, el servidor de
Vite (`dev` y `preview`) hace de proxy: el navegador pide `/api/...` al mismo origen y Vite reescribe a
`http://localhost:8080/...`.

```
Frontend/src/api/client.ts   baseURL = "/api"
Frontend/vite.config.ts      proxy "/api" -> VITE_API_PROXY_TARGET (default http://localhost:8080)
```

Variables de entorno:

| Variable | Uso | Default |
| --- | --- | --- |
| `VITE_API_PROXY_TARGET` | Destino del proxy de `vite dev` y `vite preview` | `http://localhost:8080` |
| `VITE_API_BASE_URL` | Base que usa Axios en el navegador | `/api` |
| `VITE_API_DOCS_URL` | Enlace opcional a Swagger en el footer | se deduce de una `VITE_API_BASE_URL` absoluta |

Copiá `.env.example` a `.env.local` si tu backend vive en otro puerto. En producción hay dos caminos válidos,
y el más simple es el que ya usa el desarrollo: servir `dist/` detrás del mismo origen que la API. Por defecto
el build usa `VITE_API_BASE_URL=/api`, así que el servidor tiene que reescribir `/api/*` hacia el backend
eliminando el prefijo. Un ejemplo con nginx:

```nginx
server {
    listen 80;
    root /srv/catchthemall;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

`vite preview` usa el mismo proxy `/api` que `vite dev`, así que sirve para probar un build localmente. Un
servidor estático de producción **no** hereda esa configuración: necesita el reverse proxy de arriba o un build
con `VITE_API_BASE_URL` absoluta y CORS habilitado en el backend.

## Scripts

```bash
npm run dev      # servidor de desarrollo con proxy
npm run build    # typecheck (tsc -b) + build de producción en dist/
npm run preview  # sirve dist/ con el proxy /api de Vite
npm run lint     # oxlint
npm test         # tests unitarios y de componentes (vitest)
```

## Tests

La suite usa Vitest, jsdom y Testing Library. Cubre la conservación de datos de `useAsync`, la expiración y
sincronización entre pestañas de los tokens, la renovación proactiva y los fallos de red del cliente HTTP, el
fallback accesible del avatar, los hints y errores de los campos y la paginación.

## Estructura

```
src/
  api/          tipos derivados del OpenAPI, cliente axios, tokens, mapeo de ErrorDTO, endpoints
  auth/         AuthContext (login, registro, restauración de sesión) y guards de ruta
  components/
    ui/         sistema visual 8-bit: botones, paneles, campos, modal, toasts, barras, feedback, sprites
    layout/     AppShell, Navbar, Footer, ErrorBoundary
    famous/     tarjeta del catálogo
  lib/          dominio (rareza, tipo, similitud), formato de fechas/números, validación, hook useAsync
  pages/        home, auth, pokedex, capture, captures, ranking, friends, users, profile
```

Rutas:

| Ruta | Acceso | Pantalla |
| --- | --- | --- |
| `/` | pública | Bienvenida |
| `/login`, `/registro` | solo visitantes | Acceso y alta |
| `/pokedex`, `/pokedex/:famousId` | pública | Catálogo y ficha del famoso |
| `/capturar` | con sesión | Captura por archivo o cámara |
| `/mi-pokedex` | con sesión | Historial propio |
| `/ranking` | pública | Ranking de cazadores |
| `/amigos` | con sesión | Amistades |
| `/perfil` | con sesión | Perfil y edición |
| `/usuarios/:userId` | pública | Perfil público de un cazador |

## Autenticación

- `POST /auth/register` y `POST /auth/login` devuelven `token` (JWT de 15 minutos) y `refreshToken` (opaco, 24
  horas, **se rota en cada uso**).
- El par se guarda en `localStorage` bajo `catchthemall.tokens`, junto con la expiración calculada desde
  `expiresIn`. El interceptor de Axios renueva el JWT **antes** de que venza, sin esperar un `401`.
- Ante un `401` también se renueva **una sola vez para todas las peticiones en vuelo** (un refresh concurrente
  invalidaría el token rotado) y se reintenta la petición original. Web Locks y el evento `storage` coordinan el
  refresh entre pestañas para que solo una canjee el refresh token.
- Un timeout o un corte de red al renovar **no** cierra la sesión: se conservan los tokens y se muestra el error
  de conexión. Solo se limpian si el servidor rechaza el refresh token (`401`/`404`).
- Las pestañas se sincronizan por `storage`: iniciar sesión, renovar o cerrar sesión en una se refleja en las
  demás.
- Al arrancar, si hay tokens se resuelve `GET /users/me`; el resto de las rutas privadas esperan esa
  resolución antes de redirigir.

## Decisiones de estilo

- Papel cálido (`#faf8f3`) con dos gradientes radiales muy suaves, una capa de scanlines al 2 % y una franja
  roja de 3px en el header y el footer: se percibe el guiño retro sin cansar la vista.
- Rojo Pokédex (`#d32f2f`) reservado para acciones primarias, estados activos y detalles de marca. El resto es
  papel, tinta y grises cálidos, para que el rojo destaque sin gritar.
- Estados fuera de la marca usan tintes propios: verde hoja para éxito, rose para error, azul acero para
  información y ámbar para puntaje.
- Sin `border-radius`, sin `blur` y sin degradados vistosos. Profundidad con sombras duras
  (`shadow-pixel`, `2px`/`4px`/`6px` de desplazamiento) y bordes de 2px.
- Tipografía `Silkscreen` (empaquetada con `@fontsource`, sin pedidos a Google Fonts) solo en títulos,
  etiquetas, botones y números; el cuerpo usa la sans del sistema para que el texto largo se lea bien.
- Colores de rareza y de tipo aparecen únicamente en bordes, puntos y etiquetas: la grilla del catálogo se
  lee tranquila y la rareza sigue siendo visible de un vistazo.
- Animaciones cortas y con `steps()` (parpadeo del cursor, aparición de tarjetas, flotación del sprite) y
  respeto total de `prefers-reduced-motion`.
- Iconografía propia: `PixelIcon` dibuja sprites de 16×16 con rectángulos y `shape-rendering: crispEdges`,
  sin dependencias de iconos.

## Móvil

La versión de escritorio no cambia: las adaptaciones viven detrás de `sm:` / `md:` o de reglas de plataforma.

- Barra de navegación inferior fija (`MobileNav`) con los cinco accesos principales y botón de cuenta en el
  header. Se oculta en login y registro para no tapar el formulario con el teclado abierto.
- Objetivos táctiles de al menos 44 px en botones, inputs, chips y celdas de navegación; `touch-action:
  manipulation`, sin flash gris al tocar y sin selección de texto en controles.
- Inputs a 16 px en móvil para que iOS no haga zoom al enfocar; el foco automático del login solo se
  aplica con teclado y ratón, nunca en táctil.
- Modales como hoja inferior con altura máxima, scroll interno y footer fijo, respetando `safe-area-inset`.
- Pódium y ranking con una fila compacta, filtros de la Pokédex como carrusel horizontal y estadísticas en
  tres columnas apretadas en vez de tres bloques apilados.
- `viewport-fit=cover`, `100dvh`, `env(safe-area-inset-*)` y `theme-color` para que la app llegue hasta el
  notch sin quedar tapada por la barra de gestos.
- El fondo con `background-attachment: fixed` se desactiva en pantallas táctiles, donde provoca repintados.

## Accesibilidad

- HTML semántico, un solo `h1` por pantalla, `aria-label` en controles sin texto visible y `role="alert"` /
  `aria-live` en errores y toasts.
- Formularios con `aria-describedby` hacia el hint y el error a la vez, y `aria-invalid` sincronizado; al
  enviar, el foco va al primer campo inválido.
- Modal nativo `<dialog>`: top layer, foco atrapado por el navegador, cierre con `Escape`, light dismiss con
  `closedby="any"` y devolución automática del foco. Sin `overflow: hidden` sobre `html`/`body`.
- Menú móvil con Popover API (`popovertarget` / `popover="auto"`): light dismiss y `Escape` sin handlers
  manuales. Los toasts se pausan si el foco o el puntero están sobre la notificación.
- Foco visible con contorno mint de 2px en todos los interactivos.
- Los estados de carga y error siempre tienen texto, no solo color. Los esqueletos anuncian la carga con
  `role="status"` y las listas no se envuelven en regiones vivas para no re-anunciar todo en cada tecla.

## Limitaciones conocidas del backend

La UI refleja el comportamiento real documentado en `TODO.md`; ninguna de estas cosas se arregla acá:

- `PUT /users/me` y `PATCH /users/me` responden **500** por el `@PathVariable` que la ruta no provee (punto
  2). El formulario de perfil está implementado como si funcionara, según lo pedido: si el backend falla, se
  muestra el error como cualquier otro. Cuando se arregle el backend, la pantalla funciona sin cambios.
- `captured` se calcula antes de persistir: `false` significa "primera captura", `true` "ya la tenías". La UI
  lo presenta así, como "Nueva" y "Repetida".
- `GET /famous` se cachea 5 min, `GET /users/ranking` 1 h y `GET /captures/me` 15 min, sin invalidación por
  escritura. Cada pantalla afectada lo aclara con una nota discreta en lugar de mostrar datos viejos como
  frescos.
- `POST /captures/{id}/identify` responde **503** si el microservicio de reconocimiento facial no está
  levantado (`FacialRecognition/`). La UI lo explica con un mensaje propio.
- `POST /captures/create` (carga de muestras de referencia) queda fuera de alcance: es una operación de datos,
  no de usuario final.
- El rechazo por propiedad devuelve 500 en lugar de 403 (punto 3) y los partes multipart vacíos también
  (punto 4). La UI valida del lado del cliente para no llegar a esos caminos.

## Cámara

La captura por cámara usa `navigator.mediaDevices.getUserMedia`, que el navegador solo habilita en contextos
seguros: `https://` o `http://localhost`. Si abrís la app desde una IP de la red local, el botón de cámara
explica el problema y ofrece subir un archivo en su lugar. La cámara se apaga al cambiar de pestaña, al tomar
la foto y al salir de la pantalla.
