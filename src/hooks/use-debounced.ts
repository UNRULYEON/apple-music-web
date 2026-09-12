import { useEffect, useState } from "react";

const DELAY = 250;

export function useDebounced<T>(value: T, delay: number = DELAY): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
