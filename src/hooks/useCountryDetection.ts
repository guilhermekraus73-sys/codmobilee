// Detect user's country based on timezone
const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // Colombia
  'America/Bogota': 'CO',
  // Mexico
  'America/Mexico_City': 'MX',
  'America/Cancun': 'MX',
  'America/Monterrey': 'MX',
  'America/Tijuana': 'MX',
  'America/Chihuahua': 'MX',
  'America/Mazatlan': 'MX',
  'America/Hermosillo': 'MX',
  // Peru
  'America/Lima': 'PE',
  // Argentina
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Buenos_Aires': 'AR',
  'America/Argentina/Cordoba': 'AR',
  'America/Argentina/Mendoza': 'AR',
  // Guatemala
  'America/Guatemala': 'GT',
  // USA
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'America/Honolulu': 'US',
  'America/Detroit': 'US',
  'America/Indiana/Indianapolis': 'US',
  'America/Boise': 'US',
};

export const detectCountry = (): string => {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const country = TIMEZONE_TO_COUNTRY[timezone];
    
    if (country) {
      console.log('[CountryDetection] Detected country:', country, 'from timezone:', timezone);
      return country;
    }
    
    // Fallback: try to detect from navigator.language
    const language = navigator.language || '';
    if (language.includes('es-CO')) return 'CO';
    if (language.includes('es-MX')) return 'MX';
    if (language.includes('es-PE')) return 'PE';
    if (language.includes('es-AR')) return 'AR';
    if (language.includes('es-GT')) return 'GT';
    if (language.includes('en-US') || language.startsWith('en')) return 'US';
    
    console.log('[CountryDetection] Could not detect, defaulting to CO. Timezone:', timezone);
    return 'CO'; // Default to Colombia
  } catch (error) {
    console.error('[CountryDetection] Error detecting country:', error);
    return 'CO';
  }
};

export const SUPPORTED_COUNTRIES = [
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
];

// Check if a country code is in the supported checkout countries
export const isCheckoutCountry = (code: string): boolean => {
  return ['CO', 'MX', 'PE', 'GT', 'CL', 'US'].includes(code);
};

// Get default country for checkout (detects or defaults to CO)
export const getDefaultCheckoutCountry = (): string => {
  const detected = detectCountry();
  return isCheckoutCountry(detected) ? detected : 'CO';
};
