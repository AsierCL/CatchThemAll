import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RedirectIfAuthenticated, RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/layout/AppShell'

// Cada pantalla entra en su propio chunk: el bundle inicial solo carga la ruta
// que el usuario abre y el resto se descarga bajo demanda.
const HomePage = lazy(() => import('./pages/home/HomePage').then(({ HomePage }) => ({ default: HomePage })))
const NotFoundPage = lazy(() =>
  import('./pages/home/NotFoundPage').then(({ NotFoundPage }) => ({ default: NotFoundPage })),
)
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(({ LoginPage }) => ({ default: LoginPage })))
const RegisterPage = lazy(() =>
  import('./pages/auth/RegisterPage').then(({ RegisterPage }) => ({ default: RegisterPage })),
)
const PokedexPage = lazy(() =>
  import('./pages/pokedex/PokedexPage').then(({ PokedexPage }) => ({ default: PokedexPage })),
)
const FamousDetailPage = lazy(() =>
  import('./pages/pokedex/FamousDetailPage').then(({ FamousDetailPage }) => ({ default: FamousDetailPage })),
)
const RankingPage = lazy(() =>
  import('./pages/ranking/RankingPage').then(({ RankingPage }) => ({ default: RankingPage })),
)
const UserProfilePage = lazy(() =>
  import('./pages/users/UserProfilePage').then(({ UserProfilePage }) => ({ default: UserProfilePage })),
)
const CapturePage = lazy(() =>
  import('./pages/capture/CapturePage').then(({ CapturePage }) => ({ default: CapturePage })),
)
const MyPokedexPage = lazy(() =>
  import('./pages/captures/MyPokedexPage').then(({ MyPokedexPage }) => ({ default: MyPokedexPage })),
)
const FriendsPage = lazy(() =>
  import('./pages/friends/FriendsPage').then(({ FriendsPage }) => ({ default: FriendsPage })),
)
const ProfilePage = lazy(() =>
  import('./pages/profile/ProfilePage').then(({ ProfilePage }) => ({ default: ProfilePage })),
)

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />

        <Route
          path="login"
          element={
            <RedirectIfAuthenticated>
              <LoginPage />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="registro"
          element={
            <RedirectIfAuthenticated>
              <RegisterPage />
            </RedirectIfAuthenticated>
          }
        />

        <Route path="pokedex" element={<PokedexPage />} />
        <Route path="pokedex/:famousId" element={<FamousDetailPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="usuarios/:userId" element={<UserProfilePage />} />

        <Route
          path="capturar"
          element={
            <RequireAuth>
              <CapturePage />
            </RequireAuth>
          }
        />
        <Route
          path="mi-pokedex"
          element={
            <RequireAuth>
              <MyPokedexPage />
            </RequireAuth>
          }
        />
        <Route
          path="amigos"
          element={
            <RequireAuth>
              <FriendsPage />
            </RequireAuth>
          }
        />
        <Route
          path="perfil"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
