import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CHECKOUT_COUNTRIES = [
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
];

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CountrySelector = ({ value, onChange, disabled }: CountrySelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="bg-gray-50 border-gray-200 h-12 text-gray-900">
        <SelectValue placeholder="Selecciona tu país" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
        {CHECKOUT_COUNTRIES.map((country) => (
          <SelectItem 
            key={country.code} 
            value={country.code}
            className="cursor-pointer hover:bg-gray-100"
          >
            <span className="flex items-center gap-2">
              <span>{country.flag}</span>
              <span>{country.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CountrySelector;
