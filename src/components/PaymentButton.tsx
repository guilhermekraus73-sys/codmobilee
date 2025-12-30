import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) || 
    (userAgent.includes('mac') && 'ontouchend' in document);
};

const ApplePayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.72 7.72c-.47-.52-1.12-.87-1.87-.87-.88 0-1.47.35-1.97.35-.52 0-1.32-.35-2.08-.35-1.64 0-3.32 1.35-3.32 3.89 0 1.59.62 3.27 1.38 4.36.66.92 1.23 1.67 2.11 1.67.81 0 1.16-.52 2.16-.52.99 0 1.25.52 2.13.52.91 0 1.51-.83 2.11-1.65.66-.94.94-1.86.96-1.91-.02-.01-1.84-.73-1.86-2.87-.02-1.79 1.44-2.66 1.51-2.7-.83-1.24-2.13-1.38-2.58-1.41-.21-.02-.45-.03-.68.49zm-1.75-2.22c.54-.66.91-1.56.81-2.47-.78.03-1.73.52-2.29 1.18-.5.58-.94 1.51-.82 2.4.86.07 1.74-.45 2.3-1.11z"/>
  </svg>
);

const GooglePayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface PaymentButtonProps {
  onClick?: () => void;
}

const PaymentButton = ({ onClick }: PaymentButtonProps) => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(isIOSDevice());
  }, []);

  if (isIOS) {
    return (
      <Button 
        type="button"
        onClick={onClick}
        className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg flex items-center justify-center gap-2"
      >
        <ApplePayIcon />
        <span>Pay</span>
      </Button>
    );
  }

  return (
    <Button 
      type="button"
      onClick={onClick}
      className="w-full h-12 bg-black hover:bg-gray-800 text-white font-medium rounded-lg flex items-center justify-center gap-2"
    >
      <GooglePayIcon />
      <span>Pay</span>
    </Button>
  );
};

export default PaymentButton;