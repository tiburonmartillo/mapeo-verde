import React, { useState, useRef } from 'react';
import { Map, Marker } from 'pigeon-maps';

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

interface EventLocationFieldProps {
  value: string;
  onChange: (next: string) => void;
}

const EventLocationField: React.FC<EventLocationFieldProps> = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.8853, -102.2916]);
  const [mapZoom, setMapZoom] = useState(13);
  const [marker, setMarker] = useState<[number, number] | null>(null);

  const handleChange = async (nextValue: string) => {
    onChange(nextValue);

    if (!nextValue || nextValue.trim().length < 3) {
      setSuggestions([]);
      if (abortRef.current) {
        abortRef.current.abort();
      }
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsSearching(true);
      const baseUrl = 'https://nominatim.openstreetmap.org/search';
      const params = new URLSearchParams({
        format: 'jsonv2',
        q: `${nextValue}, Aguascalientes`,
        addressdetails: '1',
        namedetails: '1',
        limit: '15',
        countrycodes: 'mx',
        viewbox: '-102.8,22.3,-101.8,21.5',
        bounded: '1',
      });
      const url = `${baseUrl}?${params.toString()}`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'es',
        },
      });
      if (!response.ok) {
        setSuggestions([]);
        return;
      }
      const data: any[] = await response.json();
      const qLower = nextValue.toLowerCase();
      const filtered = (data || []).filter((item: any) => {
        const address = item.address || {};
        const state: string | undefined = address.state || address.state_district;
        const displayName: string = item.display_name || '';
        return (
          (state && state.toLowerCase().includes('aguascalientes')) ||
          displayName.toLowerCase().includes('aguascalientes')
        );
      });

      const scored = filtered
        .map((item: any) => {
          const displayName: string = item.display_name || '';
          const name: string = (item.namedetails && item.namedetails.name) || '';
          const cls: string = item.class || '';
          let score = 0;

          const displayLower = displayName.toLowerCase();
          const nameLower = name.toLowerCase();

          if (nameLower === qLower) score += 5;
          else if (nameLower.startsWith(qLower)) score += 4;
          else if (displayLower.startsWith(qLower)) score += 3;
          else if (displayLower.includes(qLower)) score += 1;

          if (['amenity', 'shop', 'tourism', 'leisure', 'landuse'].includes(cls)) {
            score += 1;
          }

          return { item, score };
        })
        .sort((a: any, b: any) => b.score - a.score);

      const nextSuggestions = scored.slice(0, 5).map(({ item }: any) => ({
        label: item.display_name as string,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
      setSuggestions(nextSuggestions);
    } catch {
      // ignore network/abort errors
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <span className="text-xs font-mono text-gray-600 uppercase">
        Lugar / punto de reunión
      </span>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-transparent border-b-2 border-black/20 py-3 text-xl font-light focus:border-[#d89dff] focus:outline-none transition-all placeholder:text-gray-400"
          placeholder="Dirección o referencia del lugar"
          value={value}
          onChange={(e) => void handleChange(e.target.value)}
          required
        />
        {(suggestions.length > 0 || isSearching) && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-black/20 shadow-lg max-h-60 overflow-auto">
            {isSearching && (
              <div className="px-3 py-2 text-[11px] font-mono text-gray-500">
                Buscando lugares…
              </div>
            )}
            {suggestions.map((s) => (
              <button
                key={`${s.lat}-${s.lng}-${s.label}`}
                type="button"
                className="w-full text-left px-3 py-2 text-[11px] font-mono hover:bg-black/5 border-b border-gray-100 last:border-b-0"
                onClick={() => {
                  onChange(s.label);
                  setSuggestions([]);
                  setMarker([s.lat, s.lng]);
                  setMapCenter([s.lat, s.lng]);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="w-full h-64 border border-black bg-gray-100 overflow-hidden mt-2">
        <Map
          center={marker || mapCenter}
          zoom={mapZoom}
          height={256}
          provider={(x, y, z) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`}
          onBoundsChanged={({ center, zoom }: any) => {
            setMapCenter(center);
            setMapZoom(zoom);
          }}
          onClick={({ latLng }: { latLng: [number, number] }) => {
            const [lat, lng] = latLng;
            setMarker([lat, lng]);
          }}
        >
          {marker && <Marker width={40} anchor={marker} />}
        </Map>
      </div>
      <p className="text-[11px] font-mono text-gray-500">
        Usa el buscador o selecciona un punto en el mapa para ubicar el evento.
      </p>
    </div>
  );
};

export default EventLocationField;

