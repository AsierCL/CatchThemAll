import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Footer } from './Footer'
import { MobileNav } from './MobileNav'
import { Navbar } from './Navbar'

export function AppShell() {
  const { pathname } = useLocation()

  // Cada pantalla arranca arriba; el navegador no lo hace solo con pushState.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  // El relleno inferior deja sitio a la barra movil fija y a la safe area del telefono.
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
