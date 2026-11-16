/**
 * Anuncio unico para lectores de pantalla. `AppShell` escucha el evento y lo
 * escribe en una region `aria-live="polite"` que existe desde la carga.
 */
export function announce(message: string) {
  window.dispatchEvent(new CustomEvent<string>('app:announce', { detail: message }))
}
