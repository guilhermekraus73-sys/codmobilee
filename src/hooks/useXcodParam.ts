import { useEffect, useState } from 'react';

const XCOD_STORAGE_KEY = 'xcod_param';

/**
 * Captures xcod parameter from URL and stores it for use across the app
 */
export const useXcodParam = () => {
  const [xcod, setXcod] = useState<string | null>(null);

  useEffect(() => {
    // Try to get from URL first
    const urlParams = new URLSearchParams(window.location.search);
    const xcodFromUrl = urlParams.get('xcod');

    if (xcodFromUrl) {
      // Store in sessionStorage for persistence across navigation
      sessionStorage.setItem(XCOD_STORAGE_KEY, xcodFromUrl);
      setXcod(xcodFromUrl);
    } else {
      // Try to get from sessionStorage
      const storedXcod = sessionStorage.getItem(XCOD_STORAGE_KEY);
      if (storedXcod) {
        setXcod(storedXcod);
      }
    }
  }, []);

  return xcod;
};

/**
 * Get stored xcod value (can be used outside of React components)
 */
export const getStoredXcod = (): string | null => {
  return sessionStorage.getItem(XCOD_STORAGE_KEY);
};

/**
 * Append xcod parameter to a URL if it exists
 */
export const appendXcodToUrl = (url: string, xcod: string | null): string => {
  if (!xcod) return url;
  
  // Check if URL already has query parameters
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}xcod=${encodeURIComponent(xcod)}`;
};

/**
 * Hook that returns a function to build URLs with xcod appended
 */
export const useXcodUrl = () => {
  const xcod = useXcodParam();
  
  const buildUrl = (path: string): string => {
    return appendXcodToUrl(path, xcod);
  };

  return { xcod, buildUrl };
};
