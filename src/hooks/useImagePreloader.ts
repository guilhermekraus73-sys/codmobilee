import { useEffect } from 'react';

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const preloadImages = (sources: string[]): Promise<void[]> => {
  return Promise.all(sources.map(preloadImage));
};

export const useImagePreloader = (images: string[]) => {
  useEffect(() => {
    preloadImages(images).catch(console.error);
  }, []);
};
