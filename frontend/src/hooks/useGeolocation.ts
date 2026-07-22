import { useState, useEffect, useCallback, useRef } from 'react';
import { GeoLocation } from '../types';

interface GeolocationState {
  location: GeoLocation | null;
  error: string | null;
  isLoading: boolean;
  permission: PermissionState | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isLoading: true,
    permission: null,
  });
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      if (isMountedRef.current) {
        setState(prev => ({ ...prev, error: 'Geolocation is not supported', isLoading: false }));
      }
      return;
    }

    if (isMountedRef.current) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMountedRef.current) return;
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
          isLoading: false,
          permission: 'granted' as PermissionState,
        });
      },
      (error) => {
        if (!isMountedRef.current) return;
        setState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false,
          permission: error.code === 1 ? ('denied' as PermissionState) : ('prompt' as PermissionState),
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const watchLocation = useCallback((callback: (location: GeoLocation) => void) => {
    if (!navigator.geolocation) return () => {};

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!isMountedRef.current) return;
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setState(prev => ({ ...prev, location, isLoading: false }));
        callback(location);
      },
      (error) => {
        if (!isMountedRef.current) return;
        setState(prev => ({ ...prev, error: error.message, isLoading: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return { ...state, getLocation, watchLocation };
}

export default useGeolocation;