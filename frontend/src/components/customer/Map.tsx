import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { GeoLocation } from '../../types';
import { Navigation } from 'lucide-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

interface MapProps {
  center?: GeoLocation;
  zoom?: number;
  pickup?: GeoLocation;
  dropoff?: GeoLocation;
  riderLocation?: GeoLocation;
  onMapClick?: (location: GeoLocation) => void;
  onPickupSet?: (location: GeoLocation) => void;
  showRoute?: boolean;
  interactive?: boolean;
  className?: string;
}

export const Map: React.FC<MapProps> = ({
  center = { lat: 6.5244, lng: 3.3792 },
  zoom = 14,
  pickup,
  dropoff,
  riderLocation,
  onMapClick,
  onPickupSet,
  showRoute = false,
  interactive = true,
  className = '',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom,
      interactive,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    if (onMapClick && interactive) {
      map.current.on('click', (e) => {
        onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      });
    }

    // Add geolocate control
    if (interactive) {
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading: true,
        }),
        'bottom-right'
      );
      map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    }

    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const newMarkers: mapboxgl.Marker[] = [];

    if (pickup) {
      const el = document.createElement('div');
      el.innerHTML = `<div style="background: #F97316; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`;
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([pickup.lng, pickup.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="font-semibold">Pickup Location</p>'))
        .addTo(map.current);
      newMarkers.push(marker);
    }

    if (dropoff) {
      const el = document.createElement('div');
      el.innerHTML = `<div style="background: #EF4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`;
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([dropoff.lng, dropoff.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="font-semibold">Drop-off Location</p>'))
        .addTo(map.current);
      newMarkers.push(marker);
    }

    if (riderLocation) {
      const el = document.createElement('div');
      el.innerHTML = `<div style="background: #22C55E; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); animation: pulse 2s infinite;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>`;
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([riderLocation.lng, riderLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<p class="font-semibold">Rider Location</p>'))
        .addTo(map.current);
      newMarkers.push(marker);
    }

    markers.current = newMarkers;

    // Fit bounds to show all markers
    if (pickup && dropoff) {
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([pickup.lng, pickup.lat]);
      bounds.extend([dropoff.lng, dropoff.lat]);
      if (riderLocation) bounds.extend([riderLocation.lng, riderLocation.lat]);
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 16 });
    }
  }, [pickup, dropoff, riderLocation, mapLoaded]);

  // Draw route
  useEffect(() => {
    if (!map.current || !mapLoaded || !showRoute || !pickup || !dropoff) return;

    const drawRoute = async () => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (data.routes && data.routes[0]) {
          const route = data.routes[0].geometry;

          if (map.current!.getSource('route')) {
            (map.current!.getSource('route') as mapboxgl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: route,
            });
          } else {
            map.current!.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: route,
              },
            });

            map.current!.addLayer({
              id: 'route',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#F97316',
                'line-width': 4,
                'line-opacity': 0.8,
              },
            });
          }
        }
      } catch (err) {
        console.error('Route drawing failed:', err);
      }
    };

    drawRoute();
  }, [showRoute, pickup, dropoff, mapLoaded]);

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-dark-card flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wave-500" />
        </div>
      )}
      {onPickupSet && (
        <button
          onClick={() => {
            navigator.geolocation.getCurrentPosition((pos) => {
              onPickupSet({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
          }}
          className="absolute bottom-20 right-4 bg-white dark:bg-dark-card p-3 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
        >
          <Navigation className="w-5 h-5 text-wave-500" />
        </button>
      )}
    </div>
  );
};

export default Map;
