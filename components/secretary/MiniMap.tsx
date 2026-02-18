'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';

// Fix for default marker icons in Leaflet + Next.js
const icon = L.icon({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

// Component to handle map centering when lat/lng changes
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 15);
    }, [lat, lng, map]);
    return null;
}

interface MiniMapProps {
    lat: number;
    lng: number;
    label?: string;
}

export default function MiniMap({ lat, lng, label }: MiniMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Delay to prevent Leaflet "already initialized" error
        const timer = setTimeout(() => setIsReady(true), 80);
        return () => {
            clearTimeout(timer);
            setIsReady(false);
        }
    }, []);

    if (!isMounted || !isReady) return <div className="w-full h-full bg-slate-100 animate-pulse" />;

    return (
        <div id={`minimap-container-${lat}-${lng}`} className="w-full h-full">
            <MapContainer
                key={`mini-map-${lat}-${lng}-${Math.random()}`}
                center={[lat, lng]}
                zoom={15}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[lat, lng]} icon={icon}>
                    {label && <Popup>{label}</Popup>}
                </Marker>
                <RecenterMap lat={lat} lng={lng} />
            </MapContainer>
        </div>
    );
}
