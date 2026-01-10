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

// Domínios de email temporário/descartável (usados para fraude)
const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'temp-mail.org',
  '10minutemail.com', 'throwaway.email', 'fakeinbox.com', 'trashmail.com',
  'yopmail.com', 'sharklasers.com', 'dispostable.com', 'getairmail.com',
  'mailnesia.com', 'tempr.email', 'discard.email', 'spamgourmet.com',
  'mytemp.email', 'mohmal.com', 'tempail.com', 'emailondeck.com',
  'getnada.com', 'mintemail.com', 'mt2015.com', 'tmpmail.org',
];

// Lista de TLDs válidos conhecidos
const VALID_TLDS = [
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
  'co', 'io', 'me', 'info', 'biz', 'name', 'pro',
  'br', 'mx', 'ar', 'cl', 'pe', 'co', 'ec', 've', 'bo', 'py', 'uy',
  'es', 'pt', 'fr', 'de', 'it', 'uk', 'us', 'ca', 'au', 'nz', 'jp', 'kr', 'cn', 'in',
  'com.br', 'com.mx', 'com.ar', 'com.co', 'com.pe', 'com.ec', 'com.ve',
  'org.br', 'edu.br', 'gov.br', 'net.br',
];

// Domínios de email conhecidos e válidos
const KNOWN_EMAIL_PROVIDERS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'protonmail.com', 'proton.me',
  'zoho.com', 'mail.com', 'gmx.com', 'yandex.com', 'tutanota.com',
  'yahoo.com.br', 'hotmail.com.br', 'outlook.com.br', 'bol.com.br', 'uol.com.br', 'terra.com.br',
  'yahoo.es', 'hotmail.es', 'outlook.es',
  'yahoo.com.mx', 'hotmail.com.mx', 'outlook.com.mx',
  'yahoo.com.ar', 'hotmail.com.ar', 'outlook.com.ar',
];

// Email validation helper - valida formato e bloqueia emails descartáveis
export const isValidEmail = (email: string): boolean => {
  const trimmedEmail = email.trim().toLowerCase();
  
  // Formato básico: usuario@dominio.extensao
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domain] = parts;
  if (!domain || !localPart) return false;

  // Bloqueia domínios de email temporário/descartável
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return false;
  }

  // Verifica se é um provedor conhecido (sempre aceita)
  if (KNOWN_EMAIL_PROVIDERS.includes(domain)) {
    return true;
  }

  // Validação adicional para domínios desconhecidos
  const domainParts = domain.split('.');
  if (domainParts.length < 2) return false;

  // Verifica TLD
  const tld = domainParts[domainParts.length - 1];
  const tldPair = domainParts.length >= 3 
    ? `${domainParts[domainParts.length - 2]}.${tld}` 
    : null;
  
  // Verifica se o TLD é válido
  const hasValidTld = VALID_TLDS.includes(tld) || (tldPair && VALID_TLDS.includes(tldPair));
  if (!hasValidTld) {
    return false;
  }

  // Nome do domínio (parte antes do TLD) deve ter pelo menos 2 caracteres
  const domainName = tldPair 
    ? domainParts.slice(0, -2).join('.')
    : domainParts.slice(0, -1).join('.');
  
  if (domainName.length < 2) {
    return false;
  }

  // Bloqueia domínios que parecem aleatórios (muitas consoantes seguidas ou padrões suspeitos)
  const hasRandomPattern = /[bcdfghjklmnpqrstvwxz]{5,}/i.test(domain);
  if (hasRandomPattern) {
    return false;
  }

  // Bloqueia local parts que parecem aleatórias
  const localPartHasRandomPattern = /[bcdfghjklmnpqrstvwxz]{6,}/i.test(localPart);
  if (localPartHasRandomPattern) {
    return false;
  }

  return true;
};
