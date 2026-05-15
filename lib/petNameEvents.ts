type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribePetName(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyPetNameChanged(): void {
  listeners.forEach((fn) => fn());
}
