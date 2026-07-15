import { useEffect, useState } from 'react';
import { DefaultLoadingManager } from 'three';

export const useAssetsLoading = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    DefaultLoadingManager.onStart = () => setIsLoading(true);
    DefaultLoadingManager.onLoad = () => setIsLoading(false);
    DefaultLoadingManager.onError = () => setIsLoading(false);

    return () => {
      DefaultLoadingManager.onStart = undefined;
      DefaultLoadingManager.onLoad = () => {};
      DefaultLoadingManager.onError = () => {};
    };
  }, []);

  return isLoading;
};
