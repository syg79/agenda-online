'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    User,
    AlertCircle,
    Truck,
    CheckCircle,
    XCircle,
    Search,
    Info,
    FileText,
    Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { SmartSuggestionList } from '@/components/secretary/SmartSuggestionList';
import { DatePicker, CalendarInline } from '@/components/secretary/DatePicker';
import dynamic from 'next/dynamic';

const MiniMap = dynamic(() => import('@/components/secretary/MiniMap').then(mod => mod.default), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Carregando Mapa...</div>
});

const DailyRouteMap = dynamic(() => import('@/components/secretary/DailyRouteMap').then(mod => mod.default), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Carregando Visão de Rotas...</div>
});

// Simple types for our data
type Photographer = {
    id: string;
    name: string;
    color: string;
    services: string[];
    neighborhoods?: any; // Start optional to avoid strict type issues impacting rapid dev
};

type Booking = {
    id: string;
    clientName: string;
    date: string; // ISO string
    time: string; // "14:00"
    duration: number; // minutes
    photographerId: string | null;
    photographer?: { name: string, color: string };
    protocol?: string;
    services: string[];
    address: string;
    neighborhood?: string;
    complement?: string;
    latitude?: number | null;
    longitude?: number | null;
    status: string;
};

type DashboardData = {
    date: string;
    photographers: Photographer[];
    schedule: Booking[];
    pending: Booking[];
    stats: any;
};

export default function SecretaryDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Date State
    const getTodayLocal = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };
    const initialDate = searchParams.get('date') || getTodayLocal();
    const [selectedDate, setSelectedDate] = useState<string>(initialDate);

    // Data State
    const [data, setData] = useState<DashboardData | null>(null);
    const [error, setError] = useState('');

    // State for Selection (Click-to-Select)
    const [selectedOrder, setSelectedOrder] = useState<Booking | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'scheduled' | 'reserved' | 'waiting'>('pending');
    const [viewMode, setViewMode] = useState<'timeline' | 'map'>('timeline');

    // Modal State (Confirmation)
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        order: Booking | null;
        targetPhotographerId: string;
        targetTime: string;
    }>({
        isOpen: false,
        order: null,
        targetPhotographerId: '',
        targetTime: '',
    });
    const [isTimelineLoading, setIsTimelineLoading] = useState(true);
    const [isPendingLoading, setIsPendingLoading] = useState(true);
    const [selectedPhotographerMap, setSelectedPhotographerMap] = useState<string | 'all'>('all');
    const [showPendingMap, setShowPendingMap] = useState(false);
    const [expandedPhotographerId, setExpandedPhotographerId] = useState<string | null>(null);

    // Helper for forced photographer colors (consistent with Map)
    const getMapColor = (name: string, currentColor: string | null) => {
        const n = name.toLowerCase();
        if (n.includes('augusto')) return '#EF4444'; // Red
        if (n.includes('renato')) return '#F97316'; // Orange
        if (n.includes('rodrigo')) return '#0EA5E9'; // Light Blue
        if (n.includes('rafael')) return '#22D3EE'; // Cyan
        return currentColor || '#3B82F6';
    };

    const fetchDashboardData = async (date: string) => {
        setIsTimelineLoading(true);
        try {
            const res = await fetch(`/api/secretary/dashboard?date=${date}&type=timeline`);
            if (!res.ok) throw new Error('Falha ao carregar dados');
            const json = await res.json();
            setData(prev => {
                const base = prev || { date: '', photographers: [], schedule: [], pending: [], stats: {} };
                return {
                    ...base,
                    date: json.date || base.date,
                    photographers: json.photographers !== undefined ? json.photographers : base.photographers,
                    schedule: json.schedule !== undefined ? json.schedule : [],
                    stats: json.stats || base.stats
                };
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsTimelineLoading(false);
        }
    };

    const fetchPendingData = async () => {
        setIsPendingLoading(true);
        try {
            const res = await fetch(`/api/secretary/dashboard?type=pending`);
            if (res.ok) {
                const json = await res.json();
                setData(prev => {
                    const base = prev || { date: '', photographers: [], schedule: [], pending: [], stats: {} };
                    return {
                        ...base,
                        pending: json.pending || base.pending
                    };
                });
            }
        } finally {
            setIsPendingLoading(false);
        }
    };

    useEffect(() => {
        // Mount: Load pending once, and initial timeline
        fetchPendingData();
        fetchDashboardData(selectedDate);
    }, []);

    useEffect(() => {
        // Subsequent date changes: only refresh timeline
        if (!data) return;
        fetchDashboardData(selectedDate);
    }, [selectedDate]);

    const handleDateChange = (days: number) => {
        const d = new Date(selectedDate + 'T00:00:00'); // Use local time string
        d.setDate(d.getDate() + days); // Correct date math handles rollover

        // Prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        d.setHours(0, 0, 0, 0); // normalize target for comparison

        if (d < today) return;

        // Re-construct ISO string correctly (using local time to avoid timezone shifts)
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const newDate = `${year}-${month}-${day}`;

        setSelectedDate(newDate);
        // Update URL without refresh
        window.history.replaceState(null, '', `?date=${newDate}`);
    };

    const handleCalendarSelect = (date: Date) => {
        // Force local date interpretation by formatting back to string and adding time
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const newDate = `${y}-${m}-${d}`;
        setSelectedDate(newDate);
        window.history.replaceState(null, '', `?date=${newDate}`);
    };

    // Interaction Handlers
    const handleOrderClick = (order: Booking) => {
        if (selectedOrder?.id === order.id) {
            setSelectedOrder(null); // Deselect
        } else {
            setSelectedOrder(order); // Select
        }
    };

    const handleSlotClick = (photographerId: string, time: string) => {
        if (!selectedOrder) return;

        // Open Confirmation with full details
        setConfirmModal({
            isOpen: true,
            order: selectedOrder,
            targetPhotographerId: photographerId,
            targetTime: time,
        });
    };

    const confirmAssignment = async () => {
        if (!confirmModal.order) return;

        try {
            // Real API Call
            const res = await fetch('/api/bookings/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: confirmModal.order.id,
                    photographerId: confirmModal.targetPhotographerId,
                    date: data?.date, // Use selected date from dashboard
                    time: confirmModal.targetTime,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Falha ao agendar');
            }

            // Success Feedback
            fetchDashboardData(selectedDate); // Refresh only the day's timeline
            fetchPendingData(); // Refresh pending list specifically after assignment
            setSelectedOrder(null); // Clear selection on success

        } catch (err: any) {
            alert(err.message || 'Erro ao agendar');
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    // Render Helpers
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    const timeSlots = Array.from({ length: 11 }, (_, i) => 8 + i); // 8 to 18

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans flex-col">

            {/* TOP HEADER */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40 relative shadow-sm">

                {/* LEFT: TABS */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pendentes ({data?.pending?.length || 0})
                    </button>
                    <button
                        onClick={() => setActiveTab('scheduled')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'scheduled' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Agendados
                    </button>
                    <button
                        onClick={() => setActiveTab('reserved')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'reserved' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Reservados
                    </button>
                    <button
                        onClick={() => setActiveTab('waiting')}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'waiting' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Realizado
                    </button>
                </div>

                {/* CENTER: TITLE (Temporary) */}
                <div className="absolute left-1/2 -translate-x-1/2 font-bold text-lg text-slate-300 pointer-events-none hidden lg:block uppercase tracking-widest">
                    Painel da Secretaria
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-500 hidden md:block">
                        <strong>{data?.schedule?.length || 0}</strong> agendamentos hoje
                    </div>
                    <Link href="/agendar" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm flex items-center gap-2">
                        + Novo Pedido
                    </Link>
                </div>
            </header>

            {/* MAIN CONTENT ROW */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT SIDEBAR: Pending List */}
                <div className="w-[340px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-30 shadow-xl overflow-hidden">

                    {/* Filter / Search */}
                    <div className="p-3 bg-white border-b border-slate-100">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por nome, #ref ou endereço..."
                                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow bg-slate-50 focus:bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                        {isPendingLoading && <p className="text-center text-slate-400 py-4">Carregando...</p>}

                        {!isPendingLoading && activeTab === 'pending' && data?.pending
                            .filter(order => {
                                if (!searchTerm) return true;
                                const term = searchTerm.toLowerCase();
                                return (
                                    order.clientName.toLowerCase().includes(term) ||
                                    (order.protocol && order.protocol.toLowerCase().includes(term)) ||
                                    order.id.toLowerCase().includes(term) ||
                                    (order.neighborhood && order.neighborhood.toLowerCase().includes(term)) ||
                                    (order.address && order.address.toLowerCase().includes(term))
                                );
                            })
                            .map(order => {
                                const isSelected = selectedOrder?.id === order.id;
                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => handleOrderClick(order)}
                                        className={`
                                        flex flex-col gap-1 p-3 rounded-lg border shadow-sm cursor-pointer transition-all relative group
                                        ${isSelected
                                                ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-200 shadow-md'
                                                : 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-md'
                                            }
                                    `}
                                    >
                                        {/* Status Badge (Absolute Top Right) */}
                                        <span className="absolute top-3 right-3 text-[9px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                            PENDENTE
                                        </span>

                                        {/* Header: Ref & Client */}
                                        <div className="flex justify-between items-start pr-16"> {/* Padding right for badge */}
                                            <div className="flex flex-col gap-1 w-full">
                                                <span className="w-fit text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                                    #{order.protocol || order.id.substring(0, 6)}
                                                </span>
                                                <h3 className={`font-bold text-sm truncate w-full ${isSelected ? 'text-orange-900' : 'text-slate-800'}`}>
                                                    {order.clientName}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Address Line 1: Neighborhood */}
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mt-1">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            <span className="truncate">{order.neighborhood}</span>
                                        </div>

                                        {/* Address Line 2: Street + Complement */}
                                        <div className="pl-4 text-[11px] text-slate-500 truncate leading-tight">
                                            {order.address}
                                        </div>

                                        {/* Footer: Services (Full Width) */}
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {order.services.slice(0, 5).map(s => (
                                                <span key={s} className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                                                    {s}
                                                </span>
                                            ))}
                                            {order.services.length > 5 && (
                                                <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                    +{order.services.length - 5}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                        {!isPendingLoading && data?.pending.length === 0 && activeTab === 'pending' && (
                            <div className="text-center py-10 text-slate-400">
                                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">Tudo em dia!</p>
                            </div>
                        )}

                        {!isPendingLoading && activeTab !== 'pending' && (
                            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                <Clock className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm text-center">Visualização de <strong>{activeTab === 'scheduled' ? 'Agendados' : activeTab === 'reserved' ? 'Reservados' : 'Realizado'}</strong> em breve.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* CENTER: TIMELINE & CONTENT */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">

                    {/* Visualizing Date Info (Small indicator) */}
                    <div className="bg-white border-b border-slate-200 py-2 px-4 text-sm font-medium text-slate-600 flex justify-between items-center shadow-sm z-20">
                        <div className="flex items-center gap-4">
                            <span>Dia: <strong className="text-slate-900 ml-1">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</strong></span>

                            {/* VIEW TOGGLE */}
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-4">
                                <button
                                    onClick={() => setViewMode('timeline')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    TIMELINE
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    MAPA
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleDateChange(-1)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition disabled:opacity-20" disabled={new Date(selectedDate + 'T00:00:00') <= new Date(new Date().setHours(0, 0, 0, 0))}><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => handleDateChange(1)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {/* Timeline Container (Scrollable) */}
                    <div className="flex-1 overflow-auto p-6 pt-4 relative space-y-4">

                        {/* CALENDAR IN THE CENTER AREA */}
                        <div className="flex justify-center shrink-0">
                            <CalendarInline
                                selectedDate={new Date(selectedDate + 'T00:00:00')}
                                onDateSelect={handleCalendarSelect}
                                minDate={new Date()} // Block past dates
                                className="w-full max-w-sm shadow-md border-slate-100 bg-white"
                            />
                        </div>

                        {/* Manual Scheduling Hint */}
                        {selectedOrder && (
                            <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 shrink-0">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                    <div>
                                        <span className="font-bold">Agendando: </span>
                                        Selecione um horário na grade para <span className="font-bold">{selectedOrder.clientName}</span>.
                                    </div>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="text-[10px] bg-white px-2 py-1 rounded border border-orange-200 hover:bg-orange-100 transition font-bold uppercase">Cancelar</button>
                            </div>
                        )}

                        {viewMode === 'timeline' ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full min-w-[800px]">

                                {/* Header Row (Times) */}
                                <div className="flex border-b border-slate-100 sticky top-0 bg-white z-20">
                                    <div className="w-28 p-2 shrink-0 bg-slate-50 border-r border-slate-100 font-bold text-slate-500 text-[10px] uppercase tracking-wider flex items-center justify-center">
                                        Fotógrafo
                                    </div>
                                    {timeSlots.map(hour => (
                                        <div key={hour} className="flex-1 border-r border-slate-100 p-2 text-center text-xs font-bold text-slate-400 min-w-[48px]">
                                            {hour}:00
                                        </div>
                                    ))}
                                </div>

                                {/* Photographer Rows */}
                                {isTimelineLoading ? (
                                    <div className="p-10 text-center text-slate-400">Carregando agenda...</div>
                                ) : (
                                    data?.photographers.map(p => {
                                        const orderNeedsVideo = selectedOrder?.services.some(s => s.toLowerCase().includes('vídeo') || s.toLowerCase().includes('video'));
                                        const photographerHasVideo = p.services.some(s => s.toLowerCase().includes('vídeo') || s.toLowerCase().includes('video'));
                                        const isCompatible = !selectedOrder || !orderNeedsVideo || photographerHasVideo;
                                        const isExpanded = expandedPhotographerId === p.id;
                                        const pColor = getMapColor(p.name, p.color);

                                        return (
                                            <React.Fragment key={p.id}>
                                                <div className={`flex border-b border-slate-100 h-20 relative group ${!isCompatible ? 'opacity-40 grayscale bg-slate-50' : ''}`}>
                                                    {/* Photographer Info */}
                                                    <div
                                                        className="w-28 p-1 shrink-0 border-r border-slate-100 bg-white flex flex-col justify-center items-center text-center cursor-pointer hover:bg-slate-50 transition-colors"
                                                        onClick={() => setExpandedPhotographerId(isExpanded ? null : p.id)}
                                                    >
                                                        <div className="relative">
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm mb-1" style={{ backgroundColor: pColor }}>
                                                                {getInitials(p.name)}
                                                            </div>
                                                            {!isCompatible && selectedOrder && (
                                                                <div className="absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full p-0.5 border border-white" title="Não faz vídeo">
                                                                    <XCircle className="w-3 h-3" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="leading-tight">
                                                            <div className="font-semibold text-[10px] text-slate-800 truncate max-w-[90px]">{p.name}</div>
                                                            <div className="text-[9px] text-slate-400 capitalize mt-0.5 leading-none">{p.neighborhoods ? 'Setor fixo' : 'Livre'}</div>
                                                        </div>
                                                    </div>

                                                    {/* Time Slots (Click Zones) */}
                                                    {timeSlots.map(hour => {
                                                        const timeStr = `${hour < 10 ? '0' : ''}${hour}:00`;
                                                        const items = data.schedule.filter(s =>
                                                            s.photographerId === p.id &&
                                                            parseInt(s.time.split(':')[0]) === hour
                                                        );

                                                        const isHoverable = !!selectedOrder && isCompatible;

                                                        return (
                                                            <div
                                                                key={hour}
                                                                className={`
                                                                    flex-1 border-r border-slate-50 relative transition-colors min-w-[48px]
                                                                    ${isHoverable ? 'cursor-pointer hover:bg-orange-50 hover:ring-inset hover:ring-2 hover:ring-orange-200' : ''}
                                                                    ${!isCompatible && selectedOrder ? 'cursor-not-allowed bg-slate-50/50' : 'bg-white'}
                                                                `}
                                                                onClick={() => isCompatible && handleSlotClick(p.id, timeStr)}
                                                            >
                                                                {items.map(item => (
                                                                    <div
                                                                        key={item.id}
                                                                        className="absolute top-0.5 left-0.5 right-0.5 bottom-0.5 rounded p-1 text-[9px] border border-l-2 shadow-sm overflow-hidden z-10 leading-tight"
                                                                        style={{
                                                                            backgroundColor: `${pColor}10`,
                                                                            borderColor: pColor,
                                                                            color: '#334155'
                                                                        }}
                                                                        title={`${item.time} - ${item.clientName}`}
                                                                    >
                                                                        <div className="flex justify-between items-start mb-0.5">
                                                                            <div className="font-bold truncate text-[10px]">{item.clientName}</div>
                                                                            <div className="text-[8px] font-black opacity-50">#{item.protocol || item.id.substring(0, 4)}</div>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-0.5 mt-1 overflow-hidden h-[24px]">
                                                                            {item.services.slice(0, 2).map(s => (
                                                                                <span key={s} className="text-[7px] bg-white/50 px-1 rounded-sm border border-black/5 truncate max-w-[45px]">
                                                                                    {s}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                        <div className="truncate opacity-75 mt-1 text-[8px] font-medium">{item.neighborhood}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Expanded Map (Accordion) */}
                                                {isExpanded && (
                                                    <div className="flex bg-white h-[350px] border-b border-slate-100 animate-in slide-in-from-top duration-300 overflow-hidden shrink-0">
                                                        <div className="w-28 shrink-0 bg-slate-50 border-r border-slate-100 p-2 flex flex-col items-center justify-center gap-2">
                                                            <MapPin className="w-4 h-4 text-blue-500" />
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter text-center">Rota do Dia</span>
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <DailyRouteMap
                                                                schedule={data.schedule}
                                                                photographers={data.photographers}
                                                                filterId={p.id}
                                                                onOrderClick={handleOrderClick}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col h-full gap-4">
                                {/* Map Photographer Filter */}
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                                    <button
                                        onClick={() => setSelectedPhotographerMap('all')}
                                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border ${selectedPhotographerMap === 'all'
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        Todos os Fotógrafos
                                    </button>
                                    {data?.photographers.map(p => {
                                        const pColor = getMapColor(p.name, p.color);
                                        const isSelected = selectedPhotographerMap === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPhotographerMap(p.id)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm border flex items-center gap-2 ${isSelected
                                                    ? 'bg-white text-slate-800 border-2 shadow-md'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                                style={isSelected ? { borderColor: pColor } : {}}
                                            >
                                                <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: pColor }}></div>
                                                {p.name}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Second Row: Pending Toggle */}
                                <div className="flex justify-end px-1">
                                    <label className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200 group">
                                        <input
                                            type="checkbox"
                                            checked={showPendingMap}
                                            onChange={(e) => setShowPendingMap(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                        />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap group-hover:text-slate-700">Ver Pendentes</span>
                                    </label>
                                </div>

                                <div key={`map-view-${selectedDate}-${selectedPhotographerMap}-${showPendingMap}-${data?.schedule?.length}`} className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full h-[620px] relative">
                                    {!isTimelineLoading && data ? (
                                        <DailyRouteMap
                                            schedule={data.schedule}
                                            pending={data.pending}
                                            photographers={data.photographers}
                                            filterId={selectedPhotographerMap}
                                            showPending={showPendingMap}
                                            onOrderClick={handleOrderClick}
                                        />
                                    ) : (
                                        <div className="p-10 text-center text-slate-400 h-full flex items-center justify-center">Carregando Visão de Rotas...</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR (Nested inside main content row for proper layout) */}
                {selectedOrder && (
                    <div className="w-80 bg-white border-l border-slate-200 shadow-xl overflow-y-auto z-40 animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-500" />
                                Sugestões Inteligentes
                            </h3>
                            <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-slate-200 rounded-full transition"><XCircle className="w-4 h-4 text-slate-400" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <SmartSuggestionList
                                targetLat={selectedOrder.latitude ?? null}
                                targetLng={selectedOrder.longitude ?? null}
                                currentDate={selectedDate}
                                onSelectSuggestion={(photographerId: string, time: string) => {
                                    setConfirmModal({
                                        isOpen: true,
                                        order: selectedOrder,
                                        targetPhotographerId: photographerId,
                                        targetTime: time
                                    });
                                }}
                                onSelectOpportunity={(orderId: string) => {
                                    const opp = data?.pending.find(p => p.id === orderId);
                                    if (opp) setSelectedOrder(opp);
                                }}
                            />
                        </div>
                    </div>
                )}

            </div>

            {/* Confirmation Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-md transition-all animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl p-0 max-w-4xl w-full overflow-hidden animate-in zoom-in duration-200 border border-slate-200">
                        {/* Modal Header: Bairro - Endereço */}
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center group">
                            <div className="flex flex-col">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    {confirmModal.order?.neighborhood && `${confirmModal.order.neighborhood} - `}{confirmModal.order?.address}
                                </h3>
                                {confirmModal.order?.complement && (
                                    <div className="text-[11px] font-medium text-slate-500 ml-6 flex items-center gap-1">
                                        <Info className="w-3 h-3 opacity-50" />
                                        {confirmModal.order.complement}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body: Two Columns, No Internal Scrollbar (if possible) */}
                        <div className="flex flex-col md:flex-row h-[420px] overflow-hidden">
                            {/* Left Column: Form & Details (Compact) */}
                            <div className="flex-1 p-5 space-y-4 overflow-hidden border-r border-slate-100 bg-white flex flex-col justify-between">
                                <div className="space-y-3">
                                    {/* 1. Dia - dia da semana */}
                                    <div className="flex items-center gap-2 group/item">
                                        <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600 group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
                                            <CalendarIcon className="w-4 h-4" />
                                        </div>
                                        <span className="text-[14px] font-bold text-slate-800">
                                            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long' })}
                                        </span>
                                    </div>

                                    {/* 2. Hora */}
                                    <div className="flex items-center gap-2 group/item">
                                        <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center text-orange-600 group-hover/item:bg-orange-600 group-hover/item:text-white transition-colors">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="time"
                                                value={confirmModal.targetTime}
                                                onChange={(e) => setConfirmModal({ ...confirmModal, targetTime: e.target.value })}
                                                className="w-28 bg-white border border-slate-200 rounded-lg px-3 py-1 text-[15px] font-bold text-slate-800 focus:border-blue-500 focus:outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* 3. Fotógrafo */}
                                    <div className="flex items-center gap-2 group/item">
                                        <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 group-hover/item:bg-slate-400 group-hover/item:text-white transition-colors">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: data?.photographers.find((p: any) => p.id === confirmModal.targetPhotographerId)?.color || '#3b82f6' }}>
                                                {getInitials(data?.photographers.find((p: any) => p.id === confirmModal.targetPhotographerId)?.name || '')}
                                            </div>
                                            <span className="text-[14px] font-bold text-slate-800 truncate">{data?.photographers.find((p: any) => p.id === confirmModal.targetPhotographerId)?.name}</span>
                                        </div>
                                    </div>

                                    {/* 4. Serviços */}
                                    <div className="flex items-start gap-2 group/item">
                                        <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 mt-0.5 shrink-0">
                                            <Truck className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 flex flex-wrap gap-1 items-start min-h-[48px]">
                                            {confirmModal.order?.services.map(s => (
                                                <span key={s} className="text-[10px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                                    {s}
                                                </span>
                                            ))}
                                            {/* Extra space placeholder for up to 6 items visually if needed */}
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100 my-2"></div>

                                    {/* 5. Ref. */}
                                    <div className="flex items-center gap-2 group/item">
                                        <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                                            <FileText className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Ref.</span>
                                            <span className="text-[11px] font-bold text-slate-600">#{confirmModal.order?.protocol || confirmModal.order?.id.substring(0, 6)}</span>
                                        </div>
                                    </div>

                                    {/* 6. Cliente */}
                                    <div className="flex items-center gap-2 group/item">
                                        <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                                            <Briefcase className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Cliente</span>
                                            <span className="text-[11px] font-bold text-slate-800 truncate max-w-[150px]">{confirmModal.order?.clientName}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Interaction Map (Clean) */}
                            <div className="flex-1 bg-slate-50 relative overflow-hidden">
                                {(confirmModal.order?.latitude && confirmModal.order?.longitude) ? (
                                    <div className="w-full h-full">
                                        <MiniMap
                                            lat={confirmModal.order.latitude}
                                            lng={confirmModal.order.longitude}
                                            label={confirmModal.order.clientName}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3 border-l border-slate-100">
                                        <MapPin className="w-8 h-8 opacity-10" />
                                        <span className="text-[9px] font-black uppercase tracking-widest opacity-30">Sem Coordenadas</span>
                                    </div>
                                )}
                            </div>
                        </div>



                        {/* Modal Footer: Smaller font, plus Editar button */}
                        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg transition-all border border-slate-200 bg-white text-[11px] uppercase tracking-wider"
                            >
                                Editar
                            </button>
                            <div className="flex-1"></div>
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-all border border-slate-200 bg-white text-[11px] uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAssignment}
                                className="px-6 py-2 bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 active:scale-95"
                            >
                                Confirmar Agendamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
