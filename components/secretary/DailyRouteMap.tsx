'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Tooltip } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Home, Camera, Clock, FileText } from 'lucide-react';
import { renderToString } from 'react-dom/server';

// Custom colored markers for different photographers
const getMarkerIcon = (color: string, number: number | string, isBase: boolean = false, isSelected: boolean = false) => {
    const size = isSelected ? (isBase ? 40 : 32) : (isBase ? 32 : 24);
    const fontSize = isSelected ? (isBase ? '16px' : '14px') : (isBase ? '14px' : '12px');
    const borderSize = isSelected ? '3px' : '2px';

    const iconHtml = renderToString(
        <div style={{
            backgroundColor: isBase ? 'white' : color,
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            border: `${borderSize} solid ${isSelected ? '#1e293b' : (isBase ? color : 'white')}`, // Dark border for selected
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isBase ? color : 'white',
            fontWeight: 'bold',
            fontSize: fontSize,
            boxShadow: isSelected ? '0 0 15px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: isSelected ? 1000 : 1,
            transform: isSelected ? 'scale(1.1)' : 'scale(1)'
        }}>
            {isBase ? <Home size={isSelected ? 20 : 16} /> : number}
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
                    borderTop: `4px solid ${isSelected ? '#1e293b' : color}`
                }} />
            )}
        </div>
    );

    return L.divIcon({
        className: 'custom-div-icon',
        html: iconHtml,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

function SetViewToFitMarkers({ markers, selectedId, allItems }: { markers: [number, number][], selectedId?: string | null, allItems: any[] }) {
    const map = useMap();

    // Pan to selected item
    useEffect(() => {
        if (selectedId) {
            const item = allItems.find(i => i.id === selectedId);
            if (item && item.latitude && item.longitude) {
                map.flyTo([item.latitude, item.longitude], 15, { duration: 1.5 });
                return;
            }
        }
        // Fallback: fit bounds if no selection or init
        if (markers.length > 0 && !selectedId) {
            const bounds = L.latLngBounds(markers);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }, [markers, map, selectedId, allItems]);
    return null;
}

import { getPhotographerColor } from '@/lib/utils';

interface DailyRouteMapProps {
    schedule: any[];
    pending?: any[];
    photographers: any[];
    filterId: string | 'all';
    showPending?: boolean;
    showPhotographerBase?: boolean;
    onOrderClick: (order: any) => void;
    selectedOrderId?: string | null;
}

export default function DailyRouteMap({ schedule, pending = [], photographers, filterId, showPending = false, showPhotographerBase = false, onOrderClick, selectedOrderId }: DailyRouteMapProps) {
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
    const isAll = !filterId || filterId === 'all';
    const filteredSchedules = isAll
        ? schedule
        : schedule.filter(s => String(s.photographerId) === String(filterId));

    // Only valid coords
    const validSchedules = filteredSchedules
        .filter(s => {
            const hasCoords = s.latitude && s.longitude;
            if (!hasCoords && isAll) {
                console.warn(`Booking ${s.id} (Photog: ${s.photographerId}) missing coordinates!`);
            }
            return hasCoords;
        })
        .sort((a, b) => {
            const timeDiff = a.time.localeCompare(b.time);
            if (timeDiff !== 0) return timeDiff;
            return a.id.localeCompare(b.id);
        });

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
        <div className="w-full h-full relative group">
            <MapContainer
                key={`daily-route-map-${filterId}-${showPending ? 'p' : ''}`}
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
                {showPhotographerBase && relevantPhotographers.map(p => {
                    const color = getPhotographerColor(p.name, p.color);
                    // Use baseLat/baseLng for the Home Icon, NOT the current latitude
                    return p.baseLat && p.baseLng && (
                        <React.Fragment key={`base-${p.id}`}>
                            <Marker
                                position={[p.baseLat, p.baseLng]}
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
                        </React.Fragment>
                    );
                })}

                {/* Draw Routes (Lines) */}
                {/* Draw Routes (Lines) */}
                {Object.entries(routesByPhotographer).map(([id, items]) => {
                    const p = photographers.find(ph => ph.id === id);
                    const color = p ? getPhotographerColor(p.name, p.color) : '#3b82f6';

                    // Create route points
                    const routePoints: [number, number][] = items.map(i => [i.latitude, i.longitude]);

                    // If showing base and base exists, prepend it to the route start
                    if (showPhotographerBase && p && p.baseLat && p.baseLng) {
                        routePoints.unshift([p.baseLat, p.baseLng]);
                    }

                    return (
                        <Polyline
                            key={id}
                            positions={routePoints}
                            color={color}
                            weight={3}
                            opacity={0.4}
                            dashArray="10, 10"
                        />
                    );
                })}

                {/* Draw Markers (Pins) - Unified list for correct offset calculation */}
                {(() => {
                    const allMarkers = [
                        ...validSchedules.map(s => ({ ...s, type: 'scheduled' })),
                        ...validPending.map(s => ({ ...s, type: 'pending' }))
                    ];

                    return allMarkers.map((s, idx) => {
                        // Round to 4 decimals for stable collision detection
                        const sLat = Number(s.latitude).toFixed(4);
                        const sLng = Number(s.longitude).toFixed(4);

                        // Find if there are other markers BEFORE this one with same rounded coords in the UNIFIED list
                        const sameCoordsAt = allMarkers.slice(0, idx).filter(other => {
                            const oLat = Number(other.latitude).toFixed(4);
                            const oLng = Number(other.longitude).toFixed(4);
                            return oLat === sLat && oLng === sLng;
                        }).length;

                        // Apply a purely horizontal spread (roughly 50 meters per overlap at this latitude)
                        // This makes markers clearly "side by side" even at lower zoom levels
                        const offsetLng = sameCoordsAt * 0.00050;

                        if (s.type === 'scheduled') {
                            const p = photographers.find(ph => ph.id === s.photographerId);
                            const pName = p?.name || s.photographer?.name || 'Agendamento';
                            const pColor = getPhotographerColor(pName, p?.color || s.photographer?.color);
                            const pRoute = routesByPhotographer[s.photographerId] || [];
                            const markerNumber = pRoute.findIndex(item => item.id === s.id) + 1;

                            return (
                                <Marker
                                    key={`bk-${s.id}`}
                                    position={[s.latitude, s.longitude + offsetLng]}
                                    icon={getMarkerIcon(pColor, markerNumber, false, s.id === selectedOrderId)}
                                    zIndexOffset={s.id === selectedOrderId ? 1000 : 0}
                                    eventHandlers={{
                                        click: () => onOrderClick(s),
                                        mouseover: (e) => e.target.openTooltip(),
                                        mouseout: (e) => e.target.closeTooltip()
                                    }}
                                >
                                    <Tooltip direction="top" offset={[0, -20]} opacity={0.9} className="custom-tooltip">
                                        <div className="text-center">
                                            <div className="font-bold text-[11px]">{s.clientName}</div>
                                            <div className="text-[9px] text-slate-500">{s.address}</div>
                                        </div>
                                    </Tooltip>
                                    <Popup>
                                        <div className="p-2 min-w-[180px]">
                                            <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</span>
                                                    <span className="font-bold text-slate-700">#{s.protocol || s.id.substring(0, 4)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</span>
                                                    <span className="font-bold text-blue-600 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {s.time}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cliente</div>
                                                <div className="font-bold text-slate-900 leading-tight">{s.clientName}</div>
                                            </div>

                                            <div className="mb-2">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Localização</div>
                                                <div className="text-xs text-slate-600 font-medium">{s.neighborhood}</div>
                                                <div className="text-[10px] text-slate-500 italic leading-tight mt-0.5">{s.address}</div>
                                            </div>

                                            <div className="mb-3">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviços</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {s.services && s.services.map((svc: string) => (
                                                        <span key={svc} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                                            {svc}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => onOrderClick(s)}
                                                className="w-full mt-2 bg-blue-600 text-white text-[10px] font-bold py-2 rounded hover:bg-blue-700 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                                            >
                                                <FileText size={12} />
                                                Ver Detalhes / Editar
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        } else {
                            // Pending Marker
                            return (
                                <Marker
                                    key={`pending-${s.id}`}
                                    position={[s.latitude, s.longitude + offsetLng]}
                                    icon={getMarkerIcon('#475569', 'P', false, s.id === selectedOrderId)}
                                    zIndexOffset={s.id === selectedOrderId ? 1000 : 0}
                                    eventHandlers={{
                                        click: () => onOrderClick(s)
                                    }}
                                >
                                    <Popup>
                                        <div className="p-2 min-w-[180px]">
                                            <div className="flex justify-between items-start mb-2 border-b border-slate-100 pb-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo</span>
                                                    <span className="font-bold text-slate-700">#{s.protocol || s.id.substring(0, 4)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Status</span>
                                                    <span className="font-bold text-orange-600 text-[10px]">PENDENTE</span>
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cliente</div>
                                                <div className="font-bold text-slate-900 leading-tight">{s.clientName}</div>
                                            </div>

                                            <div className="mb-2">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Localização</div>
                                                <div className="text-xs text-slate-600 font-medium">{s.neighborhood}</div>
                                                <div className="text-[10px] text-slate-500 italic leading-tight mt-0.5">{s.address}</div>
                                            </div>

                                            <div className="mb-3">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviços</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {s.services && s.services.map((svc: string) => (
                                                        <span key={svc} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                                            {svc}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => onOrderClick(s)}
                                                className="w-full mt-2 bg-orange-600 text-white text-[10px] font-bold py-2 rounded hover:bg-orange-700 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                                            >
                                                <Clock size={12} />
                                                Agendar Agora
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        }
                    });
                })()}

                <SetViewToFitMarkers
                    markers={allCoords}
                    selectedId={selectedOrderId}
                    allItems={[...validSchedules, ...validPending]}
                />
            </MapContainer>
        </div>
    );
}
