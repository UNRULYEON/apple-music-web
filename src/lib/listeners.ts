export interface Listeners {
  subscribe: (listener: () => void) => () => void;
  notify: () => void;
  clear: () => void;
}

export function createListeners(): Listeners {
  const listeners = new Set<() => void>();

  return {
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    notify() {
      for (const listener of listeners) {
        listener();
      }
    },
    clear() {
      listeners.clear();
    },
  };
}
