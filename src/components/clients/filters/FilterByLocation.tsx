import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin } from 'lucide-react';
import { useAdvancedFilters } from '@/hooks/clients/useAdvancedFilters';

interface FilterByLocationProps {
  states: string[];
  cities: string[];
  countries: string[]; // Adicionado
  isLoading?: boolean;
}

export const FilterByLocation = ({ states, cities, countries, isLoading }: FilterByLocationProps) => {
  const { filters, updateFilter } = useAdvancedFilters();

  const handleStateToggle = (state: string, checked: boolean) => {
    const currentStates = filters.states;
    if (checked) {
      updateFilter('states', [...currentStates, state]);
    } else {
      updateFilter('states', currentStates.filter(s => s !== state));
    }
  };

  const handleCityToggle = (city: string, checked: boolean) => {
    const currentCities = filters.cities;
    if (checked) {
      updateFilter('cities', [...currentCities, city]);
    } else {
      updateFilter('cities', currentCities.filter(c => c !== city));
    }
  };

  const handleCountryToggle = (country: string, checked: boolean) => {
    const currentCountries = filters.countries;
    if (checked) {
      updateFilter('countries', [...currentCountries, country]);
    } else {
      updateFilter('countries', currentCountries.filter(c => c !== country));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Localização</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>
    );
  }

  const hasStates = states && states.length > 0;
  const hasCities = cities && cities.length > 0;
  const hasCountries = countries && countries.length > 0; // Adicionado

  if (!hasStates && !hasCities && !hasCountries) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Localização</span>
        </div>
        <p className="text-xs text-gray-500">Nenhuma localização encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Localização</span>
        {(filters.states.length + filters.cities.length + filters.countries.length) > 0 && (
          <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
            {filters.states.length + filters.cities.length + filters.countries.length}
          </Badge>
        )}
      </div>

      {/* Países */}
      {hasCountries && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Países:</p>
          <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
            {countries.slice(0, 10).map(country => (
              <div key={country} className="flex items-center space-x-1">
                <Checkbox
                  id={`country-${country}`}
                  checked={filters.countries.includes(country)}
                  onCheckedChange={(checked) => handleCountryToggle(country, !!checked)}
                />
                <label
                  htmlFor={`country-${country}`}
                  className="text-xs cursor-pointer"
                >
                  {country}
                </label>
              </div>
            ))}
          </div>
          {countries.length > 10 && (
            <p className="text-xs text-gray-500">+{countries.length - 10} países...</p>
          )}
        </div>
      )}

      {/* Estados */}
      {hasStates && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Estados:</p>
          <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
            {states.slice(0, 10).map(state => (
              <div key={state} className="flex items-center space-x-1">
                <Checkbox
                  id={`state-${state}`}
                  checked={filters.states.includes(state)}
                  onCheckedChange={(checked) => handleStateToggle(state, !!checked)}
                />
                <label
                  htmlFor={`state-${state}`}
                  className="text-xs cursor-pointer"
                >
                  {state}
                </label>
              </div>
            ))}
          </div>
          {states.length > 10 && (
            <p className="text-xs text-gray-500">+{states.length - 10} estados...</p>
          )}
        </div>
      )}

      {/* Cidades */}
      {hasCities && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Cidades:</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {cities.slice(0, 8).map(city => (
              <div key={city} className="flex items-center space-x-2">
                <Checkbox
                  id={`city-${city}`}
                  checked={filters.cities.includes(city)}
                  onCheckedChange={(checked) => handleCityToggle(city, !!checked)}
                />
                <label
                  htmlFor={`city-${city}`}
                  className="text-xs cursor-pointer truncate"
                  title={city}
                >
                  {city}
                </label>
              </div>
            ))}
          </div>
          {cities.length > 8 && (
            <p className="text-xs text-gray-500">+{cities.length - 8} cidades...</p>
          )}
        </div>
      )}
    </div>
  );
};