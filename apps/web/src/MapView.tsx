import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';

type Position = {
  lat: number;
  lng: number;
};

type MapViewProps = {
  onAddressDetected?: (address: string) => void;
};

const DEFAULT_CENTER: Position = { lat: 36.1699, lng: -115.1398 }; // Las Vegas fallback

// Custom user icon with #ffa4b9 color
const userIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="7" fill="#ffa4b9"/>
        <circle cx="12" cy="12" r="3" fill="#ffffff"/>
      </svg>
    `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Red cross icon for hospitals/clinics
const hospitalIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="#ffffff" stroke="#ea4168" stroke-width="2"/>
        <rect x="10" y="6" width="4" height="12" fill="#ea4168"/>
        <rect x="6" y="10" width="12" height="4" fill="#ea4168"/>
      </svg>
    `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const MapView: React.FC<MapViewProps> = ({ onAddressDetected }) => {
  const [userPosition, setUserPosition] = useState<Position | null>(null);
  const [nearestHospital, setNearestHospital] = useState<{
    name: string;
    position: Position;
  } | null>(null);

  // 1) Get user position + reverse geocode address
  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextPos: Position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserPosition(nextPos);

        // Reverse geocoding for human-readable address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${nextPos.lat}&lon=${nextPos.lng}&format=jsonv2`,
            {
              headers: {
                'Accept-Language': 'en',
              },
            },
          );
          const data = await res.json();
          if (data && data.display_name && onAddressDetected) {
            onAddressDetected(data.display_name);
          }
        } catch (e) {
          console.warn('Reverse geocoding failed', e);
        }
      },
      (err) => {
        console.warn('Geolocation error', err);
      },
      {
        enableHighAccuracy: true,
      },
    );
  }, [onAddressDetected]);

  // 2) Once we know user position, look up the nearest hospital/clinic
  useEffect(() => {
    const fetchNearestHospital = async () => {
      if (!userPosition) return;

      try {
        const query = `hospital, clinic near ${userPosition.lat},${userPosition.lng}`;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query,
        )}&format=jsonv2&limit=3`;
        const res = await fetch(url, {
          headers: {
            'Accept-Language': 'en',
          },
        });
        const data = await res.json();
        console.log('Hospital search results:', data);
        if (Array.isArray(data) && data.length > 0) {
          const h = data[0];
          setNearestHospital({
            name: h.display_name || 'Nearest hospital',
            position: {
              lat: parseFloat(h.lat),
              lng: parseFloat(h.lon),
            },
          });
        } else {
          console.warn('No nearby hospital found');
        }
      } catch (e) {
        console.warn('Hospital search failed', e);
      }
    };

    fetchNearestHospital();
  }, [userPosition]);

  const center: LatLngExpression = userPosition ?? DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom={true}
      className="map-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userPosition && (
        <Marker
          position={userPosition as LatLngExpression}
          icon={userIcon}
        >
          <Popup>You are here</Popup>
        </Marker>
      )}

      {nearestHospital && (
        <Marker
          position={nearestHospital.position as LatLngExpression}
          icon={hospitalIcon}
        >
          <Popup>{nearestHospital.name}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default MapView;
