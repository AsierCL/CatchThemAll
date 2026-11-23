import { Outlet, useLocation } from 'react-router-dom'
import { Suspense, useEffect, useRef, useState } from 'react'
import { LoadingBlock } from '../ui/Feedback'
import { Footer } from './Footer'
import { MobileNav } from './MobileNav'
import { Navbar } from './Navbar'

export function AppShell() {
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const lastPathname = useRef(pathname)
  const [announcement, setAnnouncement] = useState('')

  useEffect(() => {
    const handleAnnounce = (event: Event) => {
      setAnnouncement((event as CustomEvent<string>).detail)
    }
    window.addEventListener('app:announce', handleAnnounce)
    return () => window.removeEventListener('app:announce', handleAnnounce)
  }, [])

  useEffect(() => {
    // Cada pantalla arranca arriba; el navegador no lo hace solo con pushState.
    window.scrollTo({ top: 0, behavior: 'instant' })

    // Solo movemos el foco cuando la ruta cambia. Comparar con la ruta anterior
    // evita robarle el foco inicial a la pantalla (por ejemplo, al login) y es
    // estable ante la doble invocacion de efectos de StrictMode.
    const isSameRoute = lastPathname.current === pathname
    lastPathname.current = pathname
    if (isSameRoute) return

    setAnnouncement('')
    mainRef.current?.focus({ preventScroll: true })
  }, [pathname])

  // El relleno inferior deja sitio a la barra movil fija y a la safe area del telefono.
  return (
    <div className="flex min-h-dvh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <Navbar />
      <main
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:py-10"
      >
        <Suspense fallback={<LoadingBlock label="Cargando pantalla" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileNav />
    </div>
  )
}
