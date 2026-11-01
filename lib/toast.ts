export type ToastKind = 'error' | 'success'

export interface ToastMessage {
  id: number
  kind: ToastKind
  text: string
}

type Listener = (toast: ToastMessage) => void

const listeners = new Set<Listener>()
let nextId = 1

const emit = (kind: ToastKind, text: string) => {
  const message: ToastMessage = { id: nextId++, kind, text }
  listeners.forEach((listener) => listener(message))
}

/** Avisos en pantalla; los muestra <Toaster /> (reemplaza a alert()). */
export const toast = {
  error: (text: string) => emit('error', text),
  success: (text: string) => emit('success', text),
}

export const subscribeToasts = (listener: Listener) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
