import { useState, useCallback, useRef } from 'react';
import { GeoLocation } from '../types';

interface MapViewport {
  center: GeoLocation;
  zoom: number;
}

export function useMap(initialCenter?: GeoLocation, initialZoom: number = 14) {
  const [viewport, setViewport] = useState<MapViewport>({
    center: initialCenter || { lat: 6.5244, lng: 3.3792 }, // Lagos default
    zoom: initialZoom,
  });
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
  const mapRef = useRef<any>(null);

  const flyTo = useCallback((location: GeoLocation, zoom?: number) => {
    setViewport({ center: location, zoom: zoom || viewport.zoom });
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [location.lng, location.lat],
        zoom: zoom || viewport.zoom,
        essential: true,
      });
    }
  }, [viewport.zoom]);

  const fitBounds = useCallback((locations: GeoLocation[], padding: number = 50) => {
    if (locations.length < 2 || !mapRef.current) return;

    const bounds = locations.reduce(
      (acc, loc) => ({
        minLng: Math.min(acc.minLng, loc.lng),
        maxLng: Math.max(acc.maxLng, loc.lng),
        minLat: Math.min(acc.minLat, loc.lat),
        maxLat: Math.max(acc.maxLat, loc.lat),
      }),
      { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
    );

    mapRef.current.fitBounds(
      [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
      { padding }
    );
  }, []);

  const handleMapClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat || event;
    setSelectedLocation({ lng, lat });
  }, []);

  return {
    viewport,
    setViewport,
    selectedLocation,
    setSelectedLocation,
    mapRef,
    flyTo,
    fitBounds,
    handleMapClick,
  };
}

export default useMap;
