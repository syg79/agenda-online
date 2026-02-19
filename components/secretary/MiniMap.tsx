'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Booking, Photographer } from '@/lib/types/dashboard';
import { getPhotographerColor } from '@/lib/utils';

// Helper to fix Leaflet Icon issues in Next.js
const fixLeafletIcon = () => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

interface MiniMapProps {
    lat: number;
    lng: number;
    label?: string;
    otherBookings?: Booking[];
    targetPhotographerId?: string;
    photographers?: Photographer[];
    targetTime?: string;
    showPhotographerBase?: boolean;
    pending?: Booking[];
}

const getMiniMarkerIcon = (color: string, number: number | string, isHighlighted: boolean, isBase: boolean = false) => {
    const size = isHighlighted ? 36 : (isBase ? 32 : 28);
    const fontSize = isHighlighted ? '14px' : (isBase ? '12px' : '11px');
    const borderWeight = isHighlighted ? '3px' : '2px';

    // Base has white background and colored text/border
    const bgColor = isBase ? 'white' : color;
    const textColor = isBase ? color : 'white';
    const borderColor = isBase ? color : 'white';

    // Use a blue halo only for the main highlight to distinguish it
    const shadowClass = isHighlighted ? 'box-shadow: 0 0 15px rgba(59, 130, 246, 0.8), 0 0 0 4px rgba(59, 130, 246, 0.3); z-index: 1000;' : '';

    return L.divIcon({
        className: 'custom-div-icon',
        html: `
            <div style="
                background-color: ${bgColor};
                width: ${size}px;
                height: ${size}px;
                border: ${borderWeight} solid ${borderColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${textColor};
                font-weight: 900;
                font-size: ${fontSize};
                font-family: 'Inter', sans-serif;
                ${shadowClass}
            ">
                ${number}
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

const RecenterMap = ({ lat, lng }: { lat: number; lng: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], 14);
    }, [lat, lng, map]);
    return null;
};

export default function MiniMap({
    lat,
    lng,
    label,
    otherBookings = [],
    pending = [],
    targetPhotographerId = '',
    photographers = [],
    targetTime = '',
    showPhotographerBase = true
}: MiniMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fixLeafletIcon();
        const timer = setTimeout(() => setIsReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Filter pending items nearby (e.g., within ~5km to avoid clutter)
    // 0.05 deg is roughly 5.5km
    const nearbyPending = useMemo(() => {
        return pending.filter(p => {
            if (!p.latitude || !p.longitude) return false;
            return Math.abs(Number(p.latitude) - lat) < 0.05 && Math.abs(Number(p.longitude) - lng) < 0.05;
        });
    }, [pending, lat, lng]);

    if (!isMounted || !isReady) return <div className="w-full h-full bg-slate-100 animate-pulse" />;

    // 1. FILTER: Only selected photographer's bookings
    const targetIdStr = targetPhotographerId?.toString();
    const filteredByPhotog = otherBookings.filter(b =>
        b.photographerId && b.photographerId.toString() === targetIdStr
    );

    // 2. UNIFIED LIST: Combine existing bookings + current target without duplicates
    const allRouteItems: Booking[] = [...filteredByPhotog];

    // Check if the current modal target is already in the list
    const isAlreadyInList = filteredByPhotog.find(b =>
    (Math.abs(Number(b.latitude) - lat) < 0.0001 &&
        Math.abs(Number(b.longitude) - lng) < 0.0001 &&
        b.clientName === label)
    );

    if (!isAlreadyInList) {
        allRouteItems.push({
            id: 'current-target',
            latitude: lat,
            longitude: lng,
            time: targetTime || '00:00',
            photographerId: targetPhotographerId,
            clientName: label || '',
            address: '',
            status: 'Confirmando'
        } as any);
    }

    // 3. SORT: strictly by time
    allRouteItems.sort((a, b) => a.time.localeCompare(b.time));

    // 4. Photog Base
    const targetPhotog = photographers.find(p => p.id.toString() === targetIdStr);
    const resolvedColor = targetPhotog ? (targetPhotog.color || '#3B82F6') : '#3B82F6';

    const visibleItems = allRouteItems;

    return (
        <div id={`minimap-container-${lat}-${lng}`} className="w-full h-full">
            <MapContainer
                key={`mini-map-${lat}-${lng}-${targetPhotographerId}`}
                center={[lat, lng]}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                whenReady={() => setMapReady(true)}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* Photographer Base (Pin Zero) */}
                {showPhotographerBase && targetPhotog?.latitude && targetPhotog?.longitude && (
                    <Marker
                        position={[targetPhotog.latitude, targetPhotog.longitude]}
                        icon={getMiniMarkerIcon(resolvedColor, '0', false, true)}
                        zIndexOffset={500}
                    >
                        <Popup>
                            <div className="text-[10px] font-bold">
                                Casa do Fotógrafo (Ponto Zero)
                                <div className="text-[8px] text-slate-400 font-normal">{targetPhotog.baseAddress || 'Endereço não definido'}</div>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Nearby Pending Items (Gray Pins) */}
                {nearbyPending.map(p => (
                    <Marker
                        key={`pending-${p.id}`}
                        position={[Number(p.latitude), Number(p.longitude)]}
                        icon={getMiniMarkerIcon('#94a3b8', 'P', false, false)} // Gray color
                        opacity={0.7}
                    >
                        <Popup>
                            <div className="min-w-[150px]">
                                <div className="text-xs font-bold text-slate-800 uppercase mb-0.5">{p.neighborhood || 'Bairro na'}</div>
                                <div className="text-[10px] text-slate-600 leading-tight mb-2">{p.address}</div>

                                <div className="border-t border-slate-200 pt-1 mt-1 space-y-0.5">
                                    <div className="text-[9px] text-slate-500">
                                        <span className="font-semibold">REF:</span> {p.protocol}
                                    </div>
                                    <div className="text-[9px] text-slate-500">
                                        <span className="font-semibold">Cliente:</span> {p.clientName}
                                    </div>
                                    {(p as any).notes && (
                                        <div className="text-[9px] text-slate-500">
                                            <span className="font-semibold">Corretor:</span> {(p as any).notes}
                                        </div>
                                    )}
                                    <div className="text-[10px] font-bold text-orange-500 mt-1">
                                        PENDENTE
                                    </div>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Route Lines */}
                {(() => {
                    const routeCoords = visibleItems.map(b => [b.latitude!, b.longitude!] as [number, number]);

                    // Add Base to start of route if visible
                    if (showPhotographerBase && targetPhotog?.latitude && targetPhotog?.longitude) {
                        routeCoords.unshift([targetPhotog.latitude, targetPhotog.longitude]);
                    }

                    if (routeCoords.length < 2) return null;
                    return (
                        <Polyline
                            positions={routeCoords}
                            color={resolvedColor}
                            weight={3}
                            opacity={0.4}
                            dashArray="10, 10"
                        />
                    );
                })()}

                {/* Route Markers */}
                {visibleItems.map((b, i) => {
                    const isTarget = Math.abs(Number(b.latitude) - lat) < 0.0001 && Math.abs(Number(b.longitude) - lng) < 0.0001;

                    // Calculate index in route (if base is shown, shift +1)
                    // Actually, let's keep it simple: numbering logic remains as is (1-based index of jobs)
                    const displayNum = i + 1;

                    return (
                        <Marker
                            key={b.id}
                            position={[b.latitude!, b.longitude!]}
                            icon={getMiniMarkerIcon(resolvedColor, displayNum, isTarget, false)}
                            zIndexOffset={isTarget ? 1000 : 100}
                        >
                            <Popup>
                                <div className="text-[10px] font-bold">
                                    #{displayNum} - {b.time} - {b.clientName}
                                    <div className="text-[8px] text-slate-400 font-normal">{b.address}</div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
                <RecenterMap lat={lat} lng={lng} />
            </MapContainer>
        </div>
    );
}
