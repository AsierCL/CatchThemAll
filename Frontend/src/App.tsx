import { Route, Routes } from 'react-router-dom'
import { RedirectIfAuthenticated, RequireAuth } from './auth/RequireAuth'
import { AppShell } from './components/layout/AppShell'
import { CapturePage } from './pages/capture/CapturePage'
import { MyPokedexPage } from './pages/captures/MyPokedexPage'
import { FriendsPage } from './pages/friends/FriendsPage'
import { HomePage } from './pages/home/HomePage'
import { NotFoundPage } from './pages/home/NotFoundPage'
import { FamousDetailPage } from './pages/pokedex/FamousDetailPage'
import { PokedexPage } from './pages/pokedex/PokedexPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { RankingPage } from './pages/ranking/RankingPage'
import { UserProfilePage } from './pages/users/UserProfilePage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'

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
