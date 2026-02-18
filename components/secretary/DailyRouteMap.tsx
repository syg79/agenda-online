'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Home, Camera, Clock } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Custom colored markers for different photographers
const getMarkerIcon = (color: string, number: number | string, isBase: boolean = false) => {
    const iconHtml = renderToString(
        <div style={{
            backgroundColor: isBase ? 'white' : color,
            width: isBase ? '32px' : '24px',
            height: isBase ? '32px' : '24px',
            borderRadius: '50%',
            border: `2px solid ${isBase ? color : 'white'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isBase ? color : 'white',
            fontWeight: 'bold',
            fontSize: isBase ? '14px' : '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            position: 'relative'
        }}>
            {isBase ? <Home size={16} /> : number}
            {!isBase && (
                <div style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '0',
                    height: '0',
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: `4px solid ${color}`
                }} />
            )}
        </div>
    );

    return L.divIcon({
        className: 'custom-div-icon',
        html: iconHtml,
        iconSize: isBase ? [32, 32] : [24, 24],
        iconAnchor: isBase ? [16, 16] : [12, 12],
    });
};

function SetViewToFitMarkers({ markers }: { markers: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [markers, map]);
    return null;
}

// Helper for forced photographer colors
const getPhotographerColor = (name: string, currentColor: string | null) => {
    const n = name.toLowerCase();
    if (n.includes('augusto')) return '#EF4444'; // Red
    if (n.includes('renato')) return '#F97316'; // Orange
    if (n.includes('rodrigo')) return '#0EA5E9'; // Light Blue
    if (n.includes('rafael')) return '#22D3EE'; // Cyan
    return currentColor || '#3B82F6';
};

interface DailyRouteMapProps {
    schedule: any[];
    pending?: any[];
    photographers: any[];
    filterId: string | 'all';
    showPending?: boolean;
    onOrderClick: (order: any) => void;
}

export default function DailyRouteMap({ schedule, pending = [], photographers, filterId, showPending = false, onOrderClick }: DailyRouteMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timer = setTimeout(() => setIsReady(true), 150);
        return () => {
            clearTimeout(timer);
            setIsReady(false);
        }
    }, []);

    if (!isMounted || !isReady) return <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Iniciando Leaflet...</div>;

    // Filter schedules by selected photographer if not 'all'
    const filteredSchedules = filterId === 'all'
        ? schedule
        : schedule.filter(s => s.photographerId === filterId);

    if (filterId === 'all') {
        console.log('DailyRouteMap ALL view DEBUG:', {
            totalReceived: schedule.length,
            filtered: filteredSchedules.length,
            photographersInSchedule: Array.from(new Set(schedule.map(s => s.photographerId))),
            photographersList: photographers.map(p => p.id)
        });
    }

    // Only valid coords
    const validSchedules = filteredSchedules
        .filter(s => s.latitude && s.longitude)
        .sort((a, b) => a.time.localeCompare(b.time));

    // Filter pendings by same logic (if they have coordinates)
    const validPending = (showPending ? pending : [])
        .filter(s => s.latitude && s.longitude);

    // Group by photographer for polylines (routes)
    const routesByPhotographer: { [id: string]: any[] } = {};
    validSchedules.forEach(s => {
        if (!routesByPhotographer[s.photographerId]) {
            routesByPhotographer[s.photographerId] = [];
        }
        routesByPhotographer[s.photographerId].push(s);
    });

    const allCoords: [number, number][] = [
        ...validSchedules.map(s => [s.latitude, s.longitude] as [number, number]),
        ...validPending.map(s => [s.latitude, s.longitude] as [number, number])
    ];

    // Include photographer base locations in markers if photographer is visible
    const relevantPhotographers = filterId === 'all'
        ? photographers
        : photographers.filter(p => p.id === filterId);

    relevantPhotographers.forEach(p => {
        if (p.latitude && p.longitude) {
            allCoords.push([p.latitude, p.longitude]);
        }
    });

    // Initial center
    const initialCenter: [number, number] = allCoords.length > 0 ? allCoords[0] : [-25.4296, -49.2719];

    return (
        <div id="daily-route-map-container" className="w-full h-full relative group">
            <MapContainer
                key={`daily-route-map-${filterId}-${showPending}-${Math.random()}`}
                center={initialCenter}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
            >
                <TileLayer
                    attribution='&copy; CARTO'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* Photographer Bases (Pin Zero / Home) */}
                {relevantPhotographers.map(p => {
                    const color = getPhotographerColor(p.name, p.color);
                    return p.latitude && p.longitude && (
                        <React.Fragment key={`base-${p.id}`}>
                            <Marker
                                position={[p.latitude, p.longitude]}
                                icon={getMarkerIcon(color, '0', true)}
                                zIndexOffset={1000}
                            >
                                <Popup>
                                    <div className="p-1 text-center">
                                        <div className="font-bold text-sm">Base: {p.name}</div>
                                        <div className="text-[10px] text-slate-400">{p.baseAddress || 'Endereço não definido'}</div>
                                    </div>
                                </Popup>
                            </Marker>
                            {/* Visual radius of action if defined */}
                            {p.travelRadius && (
                                <Circle
                                    center={[p.latitude, p.longitude]}
                                    radius={p.travelRadius * 1000}
                                    pathOptions={{
                                        color: color,
                                        fillColor: color,
                                        fillOpacity: 0.05,
                                        weight: 1,
                                        dashArray: '5, 5'
                                    }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}

                {/* Draw Routes (Lines) */}
                {Object.entries(routesByPhotographer).map(([id, items]) => {
                    const p = photographers.find(ph => ph.id === id);
                    const color = p ? getPhotographerColor(p.name, p.color) : '#3b82f6';
                    return (
                        <Polyline
                            key={id}
                            positions={items.map(i => [i.latitude, i.longitude])}
                            color={color}
                            weight={3}
                            opacity={0.4}
                            dashArray="10, 10"
                        />
                    );
                })}

                {/* Draw Markers (Pins) */}
                {validSchedules.map((s) => {
                    const p = photographers.find(ph => ph.id === s.photographerId);

                    // Priority: Photographer array -> Booking Photographer Relation -> Default
                    const pName = p?.name || s.photographer?.name || 'Agendamento';
                    const pColor = getPhotographerColor(pName, p?.color || s.photographer?.color);

                    const pRoute = routesByPhotographer[s.photographerId] || [];
                    const markerNumber = pRoute.findIndex(item => item.id === s.id) + 1;

                    return (
                        <Marker
                            key={`bk-${s.id}`}
                            position={[s.latitude, s.longitude]}
                            icon={getMarkerIcon(pColor, markerNumber)}
                            eventHandlers={{
                                click: () => onOrderClick(s)
                            }}
                        >
                            <Popup>
                                <div className="p-1 min-w-[150px]">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-sm">#{markerNumber}</span>
                                        <span className="text-[10px] font-black text-slate-300">#{s.protocol || s.id.substring(0, 4)}</span>
                                    </div>
                                    <div className="font-bold text-slate-800 leading-tight">{s.clientName}</div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <Camera size={10} className="opacity-50" />
                                        {s.time} - {pName}
                                    </div>
                                    <div className="text-[10px] mt-2 text-slate-400 border-t pt-1 italic">{s.address}</div>
                                    <button
                                        onClick={() => onOrderClick(s)}
                                        className="w-full mt-3 bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded hover:bg-blue-700 transition-colors uppercase tracking-wider"
                                    >
                                        Ver Detalhes / Agendar
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                {/* Draw Pending Markers (Pins) */}
                {validPending.map((s) => (
                    <Marker
                        key={s.id}
                        position={[s.latitude, s.longitude]}
                        icon={getMarkerIcon('#475569', 'P')} // Dark slate grey for pending
                        eventHandlers={{
                            click: () => onOrderClick(s)
                        }}
                    >
                        <Popup>
                            <div className="p-1 min-w-[150px]">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm text-slate-400">PENDENTE</span>
                                    <span className="text-[10px] font-black text-slate-300">#{s.protocol || s.id.substring(0, 4)}</span>
                                </div>
                                <div className="font-bold text-slate-800 leading-tight">{s.clientName}</div>
                                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    <Clock size={10} className="opacity-50" />
                                    A Definir
                                </div>
                                <div className="text-[10px] mt-2 text-slate-400 border-t pt-1 italic">{s.address}</div>
                                <button
                                    onClick={() => onOrderClick(s)}
                                    className="w-full mt-3 bg-orange-600 text-white text-[10px] font-bold py-1.5 rounded hover:bg-orange-700 transition-colors uppercase tracking-wider shadow-sm"
                                >
                                    Agendar Agora
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <SetViewToFitMarkers markers={allCoords} />
            </MapContainer>
        </div>
    );
}
