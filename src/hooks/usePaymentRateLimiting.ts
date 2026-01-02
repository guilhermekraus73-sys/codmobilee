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

// Lista de domínios válidos conhecidos
const VALID_DOMAINS = [
  // Gmail
  'gmail.com', 'googlemail.com',
  // Microsoft
  'hotmail.com', 'hotmail.com.br', 'outlook.com', 'outlook.com.br', 'live.com', 'msn.com',
  // Yahoo
  'yahoo.com', 'yahoo.com.br', 'ymail.com',
  // Apple
  'icloud.com', 'me.com', 'mac.com',
  // Proton
  'protonmail.com', 'proton.me',
  // Outros populares
  'aol.com', 'zoho.com', 'mail.com', 'gmx.com', 'tutanota.com',
  // Brasil
  'uol.com.br', 'bol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com', 'r7.com',
  // Latam
  'latinmail.com', 'starmedia.com',
];

// Padrões suspeitos de domínios falsos
const SUSPICIOUS_PATTERNS = [
  /^[a-z]{2,4}\.[a-z]{2,3}$/i, // domínios muito curtos tipo "ab.com"
  /^[a-z]+\d+\.[a-z]{2,3}$/i, // domínios com números aleatórios
  /test/i, /fake/i, /temp/i, /spam/i, /trash/i, /throw/i,
  /mailinator/i, /guerrilla/i, /10minute/i, /tempmail/i,
  /yopmail/i, /sharklasers/i, /guerrillamail/i, /dispostable/i,
];

// Email validation helper - validação robusta
export const isValidEmail = (email: string): boolean => {
  const trimmedEmail = email.trim().toLowerCase();
  
  // Formato básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  const domain = trimmedEmail.split('@')[1];
  if (!domain) return false;

  // Verifica se é um domínio conhecido/válido
  if (VALID_DOMAINS.includes(domain)) {
    return true;
  }

  // Verifica padrões suspeitos
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(domain)) {
      return false;
    }
  }

  // Domínio deve ter pelo menos 4 caracteres antes do TLD
  const domainParts = domain.split('.');
  if (domainParts[0].length < 4) {
    return false;
  }

  // Verifica se parece um domínio corporativo válido (tem estrutura razoável)
  // Domínios válidos geralmente têm vogais e consoantes misturadas
  const domainName = domainParts[0];
  const hasVowels = /[aeiou]/i.test(domainName);
  const hasConsonants = /[bcdfghjklmnpqrstvwxyz]/i.test(domainName);
  
  if (!hasVowels || !hasConsonants) {
    return false;
  }

  // Verifica sequências de caracteres repetidos (aaaa, hhhh)
  if (/(.)\1{3,}/.test(domainName)) {
    return false;
  }

  // Verifica se não é só letras aleatórias (sem padrão de palavra real)
  // Domínios com muitas consoantes seguidas são suspeitos
  if (/[bcdfghjklmnpqrstvwxyz]{5,}/i.test(domainName)) {
    return false;
  }

  return true;
};
