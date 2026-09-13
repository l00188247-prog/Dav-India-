import { useState, useEffect, useCallback, useRef } from 'react';
import { GPSLocation } from '../types';

export function useGeolocation() {
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const lastGeocodeCoords = useRef<{ lat: number; lng: number } | null>(null);

  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    // Avoid spamming reverse geocode if moved less than 50 meters
    if (lastGeocodeCoords.current) {
      const dLat = Math.abs(lastGeocodeCoords.current.lat - lat);
      const dLng = Math.abs(lastGeocodeCoords.current.lng - lng);
      if (dLat < 0.0005 && dLng < 0.0005) return;
    }
    lastGeocodeCoords.current = { lat, lng };

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.address) {
          const suburb = data.address.suburb || data.address.neighbourhood || data.address.residential || '';
          const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
          const state = data.address.state || '';
          const country = data.address.country || '';
          const parts = [suburb, city, state, country].filter(Boolean);
          const fullAddress = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '';

          setLocation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              address: fullAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              city: city || state,
              country,
            };
          });
        }
      }
    } catch {
      // Offline fallback: coordinates
      setLocation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          address: prev.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        };
      });
    }
  }, []);

  const refreshLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 10,
        timestamp: Date.now(),
        address: 'New Delhi, India (Default Demo)',
        error: 'Geolocation is not supported by your browser',
      }));
      setLoading(false);
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPermissionState('granted');
        const loc: GPSLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude,
          accuracy: Math.round(pos.coords.accuracy),
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
          address: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
          error: null,
        };
        setLocation(loc);
        setLoading(false);
        fetchAddress(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        setPermissionState(err.code === 1 ? 'denied' : 'prompt');
        // Provide graceful fallback coordinates so watermark stamp is never empty
        setLocation((prev) => ({
          latitude: prev?.latitude ?? 28.6139,
          longitude: prev?.longitude ?? 77.2090,
          accuracy: 15,
          timestamp: Date.now(),
          address: prev?.address ?? 'Location coordinates (GPS signal searching)',
          error: err.message,
        }));
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, [fetchAddress]);

  useEffect(() => {
    refreshLocation();

    let watchId: number | null = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setPermissionState('granted');
          setLocation((prev) => {
            const nextLoc: GPSLocation = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              altitude: pos.coords.altitude,
              accuracy: Math.round(pos.coords.accuracy),
              heading: pos.coords.heading ?? prev?.heading ?? null,
              speed: pos.coords.speed,
              timestamp: pos.timestamp,
              address: prev?.address ?? `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
              city: prev?.city,
              country: prev?.country,
              error: null,
            };
            return nextLoc;
          });
          fetchAddress(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Geolocation watch error:', err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 15000,
        }
      );
    }

    // Also listen to device orientation for compass heading if available
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setLocation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            heading: Math.round(360 - e.alpha!),
          };
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [refreshLocation, fetchAddress]);

  return {
    location,
    loading,
    permissionState,
    refreshLocation,
  };
}
