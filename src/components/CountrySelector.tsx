import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CHECKOUT_COUNTRIES = [
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
];

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CountrySelector = ({ value, onChange, disabled }: CountrySelectorProps) => {
  const selectedCountry = CHECKOUT_COUNTRIES.find(c => c.code === value);
  
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="bg-white border-2 border-gray-300 h-12 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
        <SelectValue>
          {selectedCountry && (
            <span className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="font-medium">{selectedCountry.name}</span>
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-300 shadow-xl z-50">
        {CHECKOUT_COUNTRIES.map((country) => (
          <SelectItem 
            key={country.code} 
            value={country.code}
            className="cursor-pointer hover:bg-gray-100 py-3"
          >
            <span className="flex items-center gap-3">
              <span className="text-lg">{country.flag}</span>
              <span className="font-medium text-gray-900">{country.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelector;
