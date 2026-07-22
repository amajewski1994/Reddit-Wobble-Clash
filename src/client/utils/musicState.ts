type Listener = () => void;

// Sound stays off until the user explicitly opts in via the music toggle
// button — no audio (music or sound effects) plays before that click.
let isSoundEnabled = false;
const listeners = new Set<Listener>();

export const getIsSoundEnabled = () => isSoundEnabled;

export const setIsSoundEnabled = (value: boolean) => {
  isSoundEnabled = value;
  listeners.forEach((listener) => listener());
};

export const subscribeSoundEnabled = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
