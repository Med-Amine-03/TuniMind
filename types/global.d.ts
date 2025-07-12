interface Window {
  faceapi: any
}

interface CustomEventMap {
  showSaveMoodModal: CustomEvent<{
    emotion: string
    confidences: Record<string, number>
  }>
}

declare global {
  interface WindowEventMap extends CustomEventMap {}
}

export {}
