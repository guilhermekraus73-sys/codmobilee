import { useEffect, useState } from 'react';

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Don't fail on error, just continue
    img.src = src;
  });
};

export const preloadImages = (sources: string[]): Promise<void[]> => {
  return Promise.all(sources.map(preloadImage));
};

export const useImagePreloader = (images: string[], showLoading = false) => {
  const [isLoading, setIsLoading] = useState(showLoading);
  const [isReady, setIsReady] = useState(!showLoading);

  useEffect(() => {
    if (images.length === 0) {
      setIsLoading(false);
      setIsReady(true);
      return;
    }

    setIsLoading(true);
    preloadImages(images)
      .then(() => {
        setIsLoading(false);
        setIsReady(true);
      })
      .catch(() => {
        setIsLoading(false);
        setIsReady(true);
      });
  }, []);

  return { isLoading, isReady };
};

// Preload images for next pages (call this in advance)
export const preloadNextPageImages = (images: string[]) => {
  // Use requestIdleCallback for non-blocking preload
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      preloadImages(images);
    });
  } else {
    setTimeout(() => {
      preloadImages(images);
    }, 100);
  }
};
