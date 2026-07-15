import { useEffect, useState } from 'react';

export const useImagePreload = (src: string): boolean => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const image = new Image();
    image.onload = () => setIsLoaded(true);
    image.onerror = () => setIsLoaded(true);
    image.src = src;
  }, [src]);

  return isLoaded;
};
