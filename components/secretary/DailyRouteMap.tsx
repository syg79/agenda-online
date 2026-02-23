'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Tooltip } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Home, Camera, Clock, FileText } from 'lucide-react';
import { renderToString } from 'react-dom/server';

const getMarkerIcon = (color: string, number: number | string, isBase: boolean = false, isSelected: boolean = false) => {
    const isPendingSelected = number === 'P' && isSelected;
    const finalColor = isPendingSelected ? '#F97316' : (isBase ? 'white' : color); // Orange if selected pending
    const textColor = isBase ? color : 'white';
    const borderColor = isSelected ? '#1e293b' : (isBase ? color : 'white');

    const size = isSelected ? (isBase ? 40 : 36) : (isBase ? 32 : 24);
    const fontSize = isSelected ? (isBase ? '16px' : '16px') : (isBase ? '14px' : '12px');
    const borderSize = isSelected ? '3px' : '2px';

    const iconHtml = renderToString(
        <div style={{
            backgroundColor: finalColor,
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            border: `${borderSize} solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: textColor,
            fontWeight: 'bold',
            fontSize: fontSize,
            boxShadow: isSelected ? `0 0 0 4px ${finalColor}50, 0 4px 12px rgba(0,0,0,0.4)` : '0 2px 4px rgba(0,0,0,0.3)',
            position: 'relative',
            zIndex: isSelected ? 1000 : 1,
            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
            transition: 'all 0.2s ease-in-out'
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
                    borderTop: `4px solid ${borderColor}`
                }} />
            )}
        </div>
    );

    return L.divIcon({
        className: `custom-div-icon ${isSelected ? 'animate-pulse-slow' : ''}`,
        html: iconHtml,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

function SetViewToFitMarkers({ markers, selectedId, allItems }: { markers: [number, number][], selectedId?: string | null, allItems: any[] }) {
    const map = useMap();

    // Pan to selected item without changing zoom
    useEffect(() => {
        if (selectedId) {
            const item = allItems.find(i => i.id === selectedId);
            if (item && item.latitude && item.longitude) {
                map.panTo([item.latitude, item.longitude], { animate: true, duration: 1 });
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
    onActionClick?: (order: any) => void; // Used for "Ver Detalhes" and "Agendar Agora"
    selectedOrderId?: string | null;
    isGlobal?: boolean; // Hides polylines in MACRO view
}

export default function DailyRouteMap({ schedule, pending = [], photographers, filterId, showPending = false, showPhotographerBase = false, onOrderClick, onActionClick, selectedOrderId, isGlobal = false }: DailyRouteMapProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isReady, setIsReady] = useState(false);

    const selectedOrderData = React.useMemo(() => {
        if (!selectedOrderId) return null;
        const allItems = [...schedule, ...(pending || [])];
        return allItems.find(i => i.id === selectedOrderId);
    }, [selectedOrderId, schedule, pending]);

    useEffect(() => {
        setIsMounted(true);
        const timer = setTimeout(() => setIsReady(true), 150);
        return () => {
            clearTimeout(timer);
            setIsReady(false);
        }
    }, []);

    // Handle ESC key to close lightbox
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedOrderData) {
                onOrderClick(selectedOrderData);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedOrderData, onOrderClick]);

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
                                <Tooltip direction="top" offset={[0, -20]} opacity={0.9} className="custom-tooltip">
                                    <div className="p-1 text-center">
                                        <div className="font-bold text-sm">Base: {p.name}</div>
                                        <div className="text-[10px] text-slate-400">{p.baseAddress || 'Endereço não definido'}</div>
                                    </div>
                                </Tooltip>
                            </Marker>
                        </React.Fragment>
                    );
                })}

                {/* Draw Routes (Lines) */}
                {!isGlobal && Object.entries(routesByPhotographer).map(([id, items]) => {
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
                                    <Tooltip direction="top" offset={[0, -20]} opacity={0.9} className="custom-tooltip">
                                        <div className="text-center">
                                            <div className="font-bold text-[11px]">{s.clientName}</div>
                                            <div className="text-[9px] text-slate-500">{s.address}</div>
                                        </div>
                                    </Tooltip>
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

            {/* Custom Compact Overlay Lightbox */}
            {selectedOrderData && (
                <div className="absolute top-4 right-4 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200/60 z-[9999] overflow-hidden animate-in slide-in-from-top-4 fade-in duration-200">
                    <div className="p-3">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referência</span>
                                <span className="font-bold text-slate-800 text-xs">#{selectedOrderData.protocol || selectedOrderData.id.substring(0, 4)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col items-end">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${selectedOrderData.status === 'CONFIRMED' ? 'text-blue-400' : 'text-orange-400'}`}>Status</span>
                                    <span className={`font-bold text-[9px] ${selectedOrderData.status === 'CONFIRMED' ? 'text-blue-600' : 'text-orange-600'}`}>
                                        {selectedOrderData.status === 'CONFIRMED' ? 'AGENDADO' : 'PENDENTE'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => onOrderClick(selectedOrderData)}
                                    className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Fechar"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>

                        <div className="mb-2 bg-slate-50 border border-slate-100 rounded-lg p-2">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Cliente</div>
                            <div className="font-bold text-slate-900 leading-tight text-xs block">{selectedOrderData.clientName}</div>
                            {selectedOrderData.status === 'CONFIRMED' && (
                                <div className="text-[10px] text-blue-600 font-bold mt-1 bg-blue-50 inline-block px-1.5 py-0.5 rounded">Horário: {selectedOrderData.time}</div>
                            )}
                        </div>

                        <div className="mb-2">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Localização</div>
                            <div className="text-[11px] text-slate-700 font-bold leading-tight">{selectedOrderData.neighborhood}</div>
                            <div className="text-[10px] text-slate-500 italic leading-tight mt-0.5 truncate">{selectedOrderData.address}</div>
                        </div>

                        <div className="mb-3">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Serviços</div>
                            <div className="flex flex-wrap gap-1">
                                {selectedOrderData.services && selectedOrderData.services.map((svc: string) => (
                                    <span key={svc} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 font-medium rounded border border-slate-200">
                                        {svc}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {selectedOrderData.status !== 'CONFIRMED' && (
                                <button
                                    onClick={() => onActionClick ? onActionClick(selectedOrderData) : onOrderClick(selectedOrderData)}
                                    className="w-full bg-orange-600 text-white text-[10px] font-bold py-2 rounded-lg shadow-sm hover:bg-orange-700 hover:shadow transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                                >
                                    <Clock size={12} />
                                    Agendar Agora
                                </button>
                            )}
                            <button
                                onClick={() => onActionClick ? onActionClick(selectedOrderData) : onOrderClick(selectedOrderData)}
                                className="w-full bg-slate-800 text-white text-[10px] font-bold py-2 rounded-lg shadow-sm hover:bg-slate-900 hover:shadow transition-all uppercase tracking-wider flex items-center justify-center gap-1.5"
                            >
                                <FileText size={12} />
                                {selectedOrderData.status === 'CONFIRMED' ? 'Ver Detalhes / Editar' : 'Ver Detalhes do Pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
