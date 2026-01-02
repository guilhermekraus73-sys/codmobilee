import { useState, useCallback } from 'react';

// Rate limiting constants (frontend)
const MAX_ATTEMPTS_PER_CARD = 2;
const MAX_TOTAL_ATTEMPTS = 3;
const MAX_DIFFERENT_CARDS = 3;
const MIN_DELAY_BETWEEN_ATTEMPTS = 35000; // 35 seconds

interface RateLimitState {
  attemptsByCard: Record<string, number>;
  totalAttempts: number;
  usedCards: Set<string>;
  lastAttemptTime: number | null;
  isBlocked: boolean;
  blockReason: string | null;
  cooldownRemaining: number;
}

export const usePaymentRateLimiting = () => {
  const [state, setState] = useState<RateLimitState>({
    attemptsByCard: {},
    totalAttempts: 0,
    usedCards: new Set(),
    lastAttemptTime: null,
    isBlocked: false,
    blockReason: null,
    cooldownRemaining: 0,
  });

  // Check if can attempt payment
  const canAttemptPayment = useCallback((cardLast4?: string): { allowed: boolean; reason?: string; cooldown?: number } => {
    const now = Date.now();
    
    // Check cooldown between attempts
    if (state.lastAttemptTime) {
      const timeSinceLastAttempt = now - state.lastAttemptTime;
      if (timeSinceLastAttempt < MIN_DELAY_BETWEEN_ATTEMPTS) {
        const remaining = Math.ceil((MIN_DELAY_BETWEEN_ATTEMPTS - timeSinceLastAttempt) / 1000);
        return { 
          allowed: false, 
          reason: `Espera ${remaining} segundos antes de intentar de nuevo.`,
          cooldown: remaining
        };
      }
    }

    // Check if blocked
    if (state.isBlocked) {
      return { 
        allowed: false, 
        reason: state.blockReason || 'Has excedido el límite de intentos. Por favor intenta más tarde.' 
      };
    }

    // Check total attempts
    if (state.totalAttempts >= MAX_TOTAL_ATTEMPTS) {
      return { 
        allowed: false, 
        reason: 'Has excedido el límite de intentos. Por favor intenta más tarde.' 
      };
    }

    // Check different cards limit
    if (cardLast4 && !state.usedCards.has(cardLast4) && state.usedCards.size >= MAX_DIFFERENT_CARDS) {
      return { 
        allowed: false, 
        reason: 'Has usado demasiadas tarjetas diferentes. Por favor usa una de las tarjetas anteriores o intenta más tarde.' 
      };
    }

    // Check attempts per card
    if (cardLast4 && (state.attemptsByCard[cardLast4] || 0) >= MAX_ATTEMPTS_PER_CARD) {
      return { 
        allowed: false, 
        reason: 'Has excedido el límite de intentos para esta tarjeta. Por favor usa otra tarjeta.' 
      };
    }

    return { allowed: true };
  }, [state]);

  // Record a payment attempt
  const recordAttempt = useCallback((cardLast4?: string) => {
    const now = Date.now();
    
    setState(prev => {
      const newUsedCards = new Set(prev.usedCards);
      if (cardLast4) {
        newUsedCards.add(cardLast4);
      }

      const newAttemptsByCard = { ...prev.attemptsByCard };
      if (cardLast4) {
        newAttemptsByCard[cardLast4] = (newAttemptsByCard[cardLast4] || 0) + 1;
      }

      const newTotalAttempts = prev.totalAttempts + 1;
      
      // Check if should block
      let isBlocked = false;
      let blockReason = null;

      if (newTotalAttempts >= MAX_TOTAL_ATTEMPTS) {
        isBlocked = true;
        blockReason = 'Has excedido el límite máximo de intentos.';
      }

      console.log('[RateLimiting] Attempt recorded:', {
        cardLast4,
        totalAttempts: newTotalAttempts,
        usedCards: newUsedCards.size,
        isBlocked
      });

      return {
        ...prev,
        attemptsByCard: newAttemptsByCard,
        totalAttempts: newTotalAttempts,
        usedCards: newUsedCards,
        lastAttemptTime: now,
        isBlocked,
        blockReason,
      };
    });
  }, []);

  // Handle backend rate limit response
  const handleRateLimitResponse = useCallback((response: { blocked?: boolean; reason?: string; error?: string }) => {
    if (response.blocked) {
      setState(prev => ({
        ...prev,
        isBlocked: true,
        blockReason: response.error || 'Rate limit exceeded',
      }));
    }
  }, []);

  // Reset rate limiting (for testing or after timeout)
  const reset = useCallback(() => {
    setState({
      attemptsByCard: {},
      totalAttempts: 0,
      usedCards: new Set(),
      lastAttemptTime: null,
      isBlocked: false,
      blockReason: null,
      cooldownRemaining: 0,
    });
  }, []);

  // Get cooldown remaining
  const getCooldownRemaining = useCallback((): number => {
    if (!state.lastAttemptTime) return 0;
    const elapsed = Date.now() - state.lastAttemptTime;
    const remaining = Math.max(0, MIN_DELAY_BETWEEN_ATTEMPTS - elapsed);
    return Math.ceil(remaining / 1000);
  }, [state.lastAttemptTime]);

  return {
    ...state,
    canAttemptPayment,
    recordAttempt,
    handleRateLimitResponse,
    reset,
    getCooldownRemaining,
  };
};

// Email validation helper
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};
