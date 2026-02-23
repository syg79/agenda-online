'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
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
import { SlotSuggestionList } from '@/components/secretary/SlotSuggestionList';
import { DatePicker, CalendarInline } from '@/components/secretary/DatePicker';
import { DashboardSidebar } from '@/components/secretary/DashboardSidebar';
import { SchedulingBanner } from '@/components/secretary/SchedulingBanner';
import { SchedulingModal } from '@/components/secretary/SchedulingModal';
import { Booking, Photographer, DashboardData } from '@/lib/types/dashboard';
import nextDynamic from 'next/dynamic';
import { ThemeToggle } from '@/components/ThemeToggle';

const MiniMap = nextDynamic(() => import('@/components/secretary/MiniMap').then(mod => mod.default), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Carregando Mapa...</div>
});

const DailyRouteMap = nextDynamic(() => import('@/components/secretary/DailyRouteMap').then(mod => mod.default), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Carregando Visão de Rotas...</div>
});



import MacroCalendarView from '@/components/secretary/MacroCalendarView';

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

    // State for Slot Selection (Situation 2)
    const [selectedSlot, setSelectedSlot] = useState<{
        photographerId: string;
        photographerName: string;
        time: string;
    } | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'scheduled' | 'reserved' | 'waiting' | 'holding' | 'completed'>('pending');
    const [viewMode, setViewMode] = useState<'timeline' | 'map' | 'global_map'>('timeline');

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
    const [showPendingMap, setShowPendingMap] = useState(true); // Default TRUE
    const [listMode, setListMode] = useState<'day' | 'total'>('day'); // 'day' | 'total'
    const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
    const [showConflictDetails, setShowConflictDetails] = useState(false);

    const fetchFutureBookings = async () => {
        try {
            const res = await fetch('/api/secretary/dashboard?mode=future');
            const json = await res.json();
            if (json.schedule) setFutureBookings(json.schedule);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (activeTab === 'scheduled' && listMode === 'total') {
            fetchFutureBookings();
        }
    }, [activeTab, listMode]);
    const [showPhotographerBase, setShowPhotographerBase] = useState(true); // Default TRUE
    const [expandedPhotographerId, setExpandedPhotographerId] = useState<string | null>(null);
    const [globalSearch, setGlobalSearch] = useState(false);
    const [showUncompleted, setShowUncompleted] = useState(false);

    // Helper for forced photographer colors (consistent with Map)
    const getMapColor = (name: string, currentColor: string | null) => {
        const n = name.toLowerCase();
        if (n.includes('augusto')) return '#EF4444'; // Red
        if (n.includes('renato')) return '#F97316'; // Orange
        if (n.includes('rodrigo')) return '#0EA5E9'; // Light Blue
        if (n.includes('rafael')) return '#22D3EE'; // Cyan
        return currentColor || '#3B82F6';
    };

    const fetchDashboardData = useCallback(async (date: string) => {
        setIsTimelineLoading(true);
        try {
            const res = await fetch(`/api/secretary/dashboard?date=${date}&type=timeline&includeOverdue=${showUncompleted}`);
            if (!res.ok) throw new Error('Falha ao carregar dados');
            const json = await res.json();
            setData(prev => {
                const defaultStats = { total: 0, scheduled: 0, pending: 0, revenue: 0 };
                const base = prev || { date: '', photographers: [], schedule: [], pending: [], stats: defaultStats };
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
    }, [showUncompleted]);

    const fetchPendingData = async () => {
        setIsPendingLoading(true);
        try {
            const res = await fetch(`/api/secretary/dashboard?type=pending`);
            if (res.ok) {
                const json = await res.json();
                console.log(`[Dashboard] Fetched pending: ${json.pending?.length}`);
                setData(prev => {
                    const defaultStats = { total: 0, scheduled: 0, pending: 0, revenue: 0 };
                    const base = prev || { date: '', photographers: [], schedule: [], pending: [], stats: defaultStats };
                    return {
                        ...base,
                        pending: json.pending || base.pending
                    };
                });
            } else {
                console.error(`[Dashboard] Fetch failed: ${res.status}`);
            }
        } catch (e) {
            console.error('[Dashboard] Fetch error:', e);
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
        // Subsequent date OR filter changes: refresh timeline
        if (!data) return;
        fetchDashboardData(selectedDate);
    }, [selectedDate, showUncompleted]);

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
    const handleOrderClick = useCallback((order: Booking) => {
        if (selectedOrder?.id === order.id) {
            setSelectedOrder(null); // Deselect
        } else {
            setSelectedOrder(order); // Select
        }
    }, [selectedOrder]);

    const handleSlotClick = (photographerId: string, time: string, photographerName: string) => {
        if (selectedOrder) {
            // Situation 1: Assign selected order to this slot
            setConfirmModal({
                isOpen: true,
                order: selectedOrder,
                targetPhotographerId: photographerId,
                targetTime: time,
            });
        } else {
            // Situation 2: Show suggestions for this slot
            setSelectedSlot({ photographerId, time, photographerName });
            setSelectedOrder(null); // Ensure order is deselected to avoid confusion
        }
    };

    const handleSelectOpportunityFromSlot = (orderId: string) => {
        const order = data?.pending.find(p => p.id === orderId);
        if (order && selectedSlot) {
            setSelectedOrder(order); // Select the order visually
            setConfirmModal({
                isOpen: true,
                order: order,
                targetPhotographerId: selectedSlot.photographerId,
                targetTime: selectedSlot.time,
            });
            setSelectedSlot(null); // Close the suggestion list
        }
    };

    const confirmAssignment = async (updatedData?: any) => {
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
                    // Pass updated fields if present
                    ...(updatedData || {})
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

    const handleUnschedule = async () => {
        if (!confirmModal.order) return;
        if (!confirm("Tem certeza que deseja remover este agendamento e voltar para pendente?")) return;

        try {
            // Call API to reset to PENDING
            const res = await fetch('/api/bookings/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: confirmModal.order.id,
                    photographerId: null, // Clear photographer
                    date: null, // Clear date
                    time: null, // Clear time
                    status: 'PENDING' // Explicitly set status back to PENDING
                }),
            });

            if (!res.ok) throw new Error('Falha ao desagendar');

            // Refresh
            fetchDashboardData(selectedDate);
            fetchPendingData();
            setSelectedOrder(null);
            setConfirmModal({ ...confirmModal, isOpen: false });

            if (!res.ok) throw new Error('Falha ao desagendar');

            // Refresh
            fetchDashboardData(selectedDate);
            fetchPendingData();
            setSelectedOrder(null);
            setConfirmModal({ ...confirmModal, isOpen: false });

        } catch (err: any) {
            alert(err.message || 'Erro ao desagendar');
        }
    };

    // Render Helpers
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // counts for tabs
    const tabCounts = React.useMemo(() => ({
        pending: data?.pending?.length || 0,
        scheduled: data?.schedule?.filter(s => s.status === 'CONFIRMED').length || 0,
        reserved: data?.schedule?.filter(s => s.status === 'RESERVED' || s.status === 'RESERVADO').length || 0,
        // waiting: old status (REALIZADO/COMPLETED)
        waiting: data?.schedule?.filter(s => s.status === 'REALIZADO' || s.status === 'COMPLETED').length || 0,
        holding: data?.schedule?.filter(s => s.status === 'WAITING' || s.status === 'AGUARDANDO').length || 0,
        completed: data?.schedule?.filter(s => s.status === 'REALIZADO' || s.status === 'COMPLETED').length || 0
    }), [data?.pending, data?.schedule]);

    const timeSlots = Array.from({ length: 11 }, (_, i) => 8 + i); // 8 to 18

    // Detect location conflicts (same lat/lng rounded, different photographers)
    const locationConflicts = React.useMemo(() => {
        if (!data?.schedule) return [];
        const groups: Record<string, any[]> = {};

        // Group both scheduled and pending to detect overlaps
        const allItems = [
            ...data.schedule.map(s => ({ ...s, type: 'scheduled' })),
            ...(data.pending || []).filter(p => p.latitude && p.longitude).map(p => ({ ...p, type: 'pending' }))
        ];

        allItems.forEach(s => {
            if (s.latitude && s.longitude) {
                // Round to 4 decimals (~11m precision) to handle slight geocoding variations
                const lat = Number(s.latitude).toFixed(4);
                const lng = Number(s.longitude).toFixed(4);
                const key = `${lat},${lng}`;
                if (!groups[key]) groups[key] = [];
                groups[key].push(s);
            }
        });

        // Conflicts are groups with more than 1 photographer (for scheduled)
        // Or groups that have BOTH scheduled and pending
        return Object.entries(groups).filter(([key, group]) => {
            const photogIds = new Set(group.filter(i => i.type === 'scheduled').map(s => s.photographerId));
            const hasPending = group.some(i => i.type === 'pending');
            const hasScheduled = group.some(i => i.type === 'scheduled');

            // It's a conflict if multiple photographers OR (one photog + a pending)
            return photogIds.size > 1 || (hasPending && hasScheduled);
        }).map(([key, group]) => ({ key, items: group }));
    }, [data?.schedule, data?.pending]);

    return (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans flex-col">

            {/* TOP HEADER */}
            <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40 relative shadow-sm">

                {/* LEFT: TABS */}
                <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${activeTab === 'pending' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pendente ({tabCounts.pending})
                    </button>
                    <button
                        onClick={() => setActiveTab('scheduled')}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${activeTab === 'scheduled' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Agendado ({tabCounts.scheduled})
                    </button>
                    <button
                        onClick={() => setActiveTab('holding')}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${activeTab === 'holding' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Aguardando ({tabCounts.holding})
                    </button>
                    <button
                        onClick={() => setActiveTab('reserved')}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${activeTab === 'reserved' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Reservado ({tabCounts.reserved})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${activeTab === 'completed' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Realizado ({tabCounts.completed})
                    </button>
                </div>

                {/* RIGHT ACTIONS (Toggle + Counter + Button) */}
                <div className="flex items-center gap-6">
                    <ThemeToggle />
                    {/* VIEW TOGGLE */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all ${viewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            TIMELINE
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            MAPA
                        </button>
                        <button
                            onClick={() => setViewMode('global_map')}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all gap-1 flex items-center ${viewMode === 'global_map' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-100 dark:ring-slate-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            MACRO
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right leading-tight">
                            <div className="text-[12px] font-black text-blue-600">{(data?.schedule?.filter(s => s.status === 'CONFIRMED').length || 0)} agendamentos</div>
                            <div className="text-[10px] font-bold text-slate-400 tracking-tighter">Hoje</div>
                        </div>
                        <Link href="/agendar" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-[10px] font-black transition shadow-md flex items-center gap-1 active:scale-95 tracking-widest">
                            <FileText className="w-3.5 h-3.5" />
                            Novo pedido
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT ROW */}
            <div className="flex flex-1 overflow-hidden">

                {/* LEFT SIDEBAR: Unified List */}
                <DashboardSidebar
                    activeTab={activeTab as any}
                    onTabChange={setActiveTab as any}
                    pendingCount={tabCounts.pending}
                    scheduledCount={tabCounts.scheduled}
                    reservedCount={tabCounts.reserved}
                    waitingCount={tabCounts.completed} // Mapped 'completed' to old 'waitingCount' prop for now, need to update Sidebar
                    isLoading={isPendingLoading}
                    items={(() => {
                        let baseItems: Booking[] = [];
                        if (globalSearch) {
                            baseItems = [
                                ...(data?.pending || []),
                                ...(data?.schedule || [])
                            ];
                        } else {
                            if (activeTab === 'pending') baseItems = data?.pending || [];
                            else if (activeTab === 'scheduled') baseItems = data?.schedule.filter((s: Booking) => s.status === 'CONFIRMED') || [];
                            else if (activeTab === 'reserved') baseItems = data?.schedule.filter((s: Booking) => s.status === 'RESERVED' || s.status === 'RESERVADO') || [];
                            else if (activeTab === 'completed') baseItems = data?.schedule.filter((s: Booking) => s.status === 'REALIZADO' || s.status === 'COMPLETED') || [];
                            else if (activeTab === 'holding') baseItems = data?.schedule.filter((s: Booking) => s.status === 'WAITING' || s.status === 'AGUARDANDO') || [];
                        }
                        return baseItems;
                    })()}
                    selectedOrder={selectedOrder}
                    onOrderClick={handleOrderClick}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    globalSearch={globalSearch}
                    onGlobalSearchChange={setGlobalSearch}
                    showUncompleted={showUncompleted}
                    onShowUncompletedChange={setShowUncompleted}
                    getMapColor={getMapColor}
                    getInitials={getInitials}
                    listMode={listMode}
                    onListModeChange={setListMode}
                    futureItems={futureBookings}
                />

                {/* CENTER: TIMELINE & CONTENT */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 relative transition-colors">

                    {/* Timeline Container (Scrollable) */}
                    <div className="flex-1 overflow-auto p-6 pt-2 relative space-y-4">

                        {/* CALENDAR IN THE CENTER AREA */}
                        {viewMode !== 'global_map' && (
                            <div className="flex justify-center shrink-0">
                                <CalendarInline
                                    selectedDate={new Date(selectedDate + 'T00:00:00')}
                                    onDateSelect={handleCalendarSelect}
                                    minDate={new Date()} // Block past dates
                                    className="w-full max-w-sm shadow-md border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 transition-colors"
                                />
                            </div>
                        )}

                        {/* Manual Scheduling Hint */}
                        {selectedOrder && (
                            <SchedulingBanner
                                selectedOrder={selectedOrder}
                                onCancel={() => setSelectedOrder(null)}
                                onScheduleManual={() => setConfirmModal({
                                    isOpen: true,
                                    order: selectedOrder,
                                    targetPhotographerId: selectedOrder.photographerId || (data?.photographers[0]?.id || ''),
                                    targetTime: selectedOrder.time || '08:00'
                                })}
                            />
                        )}

                        {viewMode === 'timeline' ? (
                            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden w-full min-w-[800px] transition-colors">

                                {/* Combined Sticky Header: Date + Slots */}
                                <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 shadow-sm dark:shadow-slate-900/50">
                                    {/* Date Bar */}
                                    <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800 relative group">
                                        <button
                                            onClick={() => handleDateChange(-1)}
                                            className="p-1 px-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-200"
                                            disabled={new Date(selectedDate + 'T00:00:00') <= new Date(new Date().setHours(0, 0, 0, 0))}
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        <span className="text-slate-900 dark:text-slate-100 font-extrabold text-[14px]">
                                            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).replace(/ de /g, ' de ')}
                                        </span>

                                        <button
                                            onClick={() => handleDateChange(1)}
                                            className="p-1 px-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-slate-200"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Grid Header (Times) */}
                                    <div className="flex border-b border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 transition-colors">
                                        <div className="w-28 p-2 shrink-0 bg-slate-50 dark:bg-slate-900/80 border-r border-slate-100 dark:border-slate-700/50 font-bold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider flex items-center justify-center">
                                            Fotógrafo
                                        </div>
                                        {timeSlots.map(hour => (
                                            <div key={hour} className="flex-1 border-r border-slate-100 dark:border-slate-700/50 p-2 text-center text-xs font-bold text-slate-400 dark:text-slate-500 min-w-[48px]">
                                                {hour}:00
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Photographer Rows */}
                                {isTimelineLoading ? (
                                    <div className="p-10 text-center text-slate-400">Carregando agenda...</div>
                                ) : (
                                    data?.photographers.map(p => {
                                        const orderNeedsVideo = selectedOrder?.services?.some(s => s.toLowerCase().includes('vídeo') || s.toLowerCase().includes('video'));
                                        const photographerHasVideo = p.services?.some(s => s.toLowerCase().includes('vídeo') || s.toLowerCase().includes('video'));
                                        const isCompatible = !selectedOrder || !orderNeedsVideo || photographerHasVideo;
                                        const isExpanded = expandedPhotographerId === p.id;
                                        const pColor = getMapColor(p.name, p.color);

                                        return (
                                            <React.Fragment key={p.id}>
                                                <div className={`flex border-b border-slate-100 dark:border-slate-800 h-20 relative group ${!isCompatible ? 'opacity-40 grayscale bg-slate-50 dark:bg-slate-800/50' : ''}`}>
                                                    {/* Photographer Info */}
                                                    <div
                                                        className="w-28 p-1 shrink-0 border-r border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-900 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
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
                                                            <div className="font-semibold text-[10px] text-slate-800 dark:text-slate-200 truncate max-w-[90px]">{p.name}</div>
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

                                                        const isHoverable = (!!selectedOrder && isCompatible) || (!selectedOrder);

                                                        return (
                                                            <div
                                                                key={hour}
                                                                className={`
                                                                    flex-1 border-r border-slate-50 dark:border-slate-800/50 relative transition-colors min-w-[48px] flex flex-row gap-0.5 p-0.5
                                                                    ${isHoverable ? 'cursor-pointer hover:bg-orange-50 dark:hover:bg-slate-700/40 hover:ring-inset hover:ring-2 hover:ring-orange-200 dark:hover:ring-slate-600' : ''}
                                                                    ${!isCompatible && selectedOrder ? 'cursor-not-allowed bg-slate-50/50 dark:bg-slate-800/30' : 'bg-white dark:bg-slate-900'}
                                                                `}
                                                                onClick={() => (isCompatible || !selectedOrder) && handleSlotClick(p.id, timeStr, p.name)}
                                                            >
                                                                {items.map(item => (
                                                                    <div
                                                                        key={item.id}
                                                                        className="flex-1 rounded p-1 text-[9px] border border-l-2 shadow-sm overflow-hidden z-10 leading-tight relative h-full min-w-[30px] cursor-pointer hover:brightness-95 transition-all text-slate-800 dark:text-slate-100"
                                                                        style={{
                                                                            backgroundColor: `${pColor}25`,
                                                                            borderColor: pColor,
                                                                        }}
                                                                        title={`${item.time} - ${item.clientName}`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setConfirmModal({
                                                                                isOpen: true,
                                                                                order: item,
                                                                                targetPhotographerId: p.id,
                                                                                targetTime: item.time
                                                                            });
                                                                        }}
                                                                    >
                                                                        <div className="flex flex-col h-full justify-between">
                                                                            {/* Top: Neighborhood (Bold) */}
                                                                            <div className="font-black truncate text-[10px] uppercase tracking-tight leading-none mb-0.5">{item.neighborhood}</div>

                                                                            {/* Middle: Address + Ref */}
                                                                            <div className="flex-1 min-h-0 flex flex-col justify-center">
                                                                                <div className="truncate text-[9px] font-medium leading-tight opacity-90">{item.address}</div>
                                                                                <div className="text-[8px] font-bold opacity-60">#{item.protocol || item.id.substring(0, 4)}</div>
                                                                            </div>

                                                                            {/* Bottom: Name + Services */}
                                                                            <div className="mt-0.5">
                                                                                <div className="truncate text-[9px] font-bold text-slate-800 dark:text-slate-100 mb-0.5">{item.clientName}</div>
                                                                                <div className="flex flex-wrap gap-0.5 overflow-hidden h-[14px]">
                                                                                    {item.services.slice(0, 2).map(s => (
                                                                                        <span key={s} className="text-[7px] bg-white/60 dark:bg-black/40 text-slate-800 dark:text-slate-200 px-1 rounded-sm border border-black/5 dark:border-white/10 truncate max-w-[45px]">
                                                                                            {s}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Expanded Map (Accordion) */}
                                                {isExpanded && (
                                                    <div className="flex bg-white dark:bg-slate-900 h-[350px] border-b border-slate-100 dark:border-slate-800 animate-in slide-in-from-top duration-300 overflow-hidden shrink-0">
                                                        <div className="w-28 shrink-0 bg-slate-50 dark:bg-slate-900/80 border-r border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center p-2 relative group overflow-hidden pl-1">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <MapPin className="w-4 h-4 text-blue-500" />
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter text-center">Rota do Dia</span>
                                                            </div>

                                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-blue-600 focus:ring-0"
                                                                    checked={showPhotographerBase}
                                                                    onChange={(e) => setShowPhotographerBase(e.target.checked)}
                                                                />
                                                                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">Casa do fotógrafo</span>
                                                            </label>

                                                            {/* Show Pending Checkbox */}
                                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-orange-600 focus:ring-0"
                                                                    checked={showPendingMap}
                                                                    onChange={(e) => setShowPendingMap(e.target.checked)}
                                                                />
                                                                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">Mostrar Pendentes</span>
                                                            </label>
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <DailyRouteMap
                                                                schedule={data.schedule}
                                                                pending={data.pending}
                                                                photographers={data.photographers}
                                                                filterId={p.id}
                                                                showPhotographerBase={showPhotographerBase}
                                                                showPending={showPendingMap}
                                                                onOrderClick={handleOrderClick}
                                                                selectedOrderId={selectedOrder?.id}
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
                                {/* Location Conflict Alert */}
                                {locationConflicts.length > 0 && (
                                    <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r-lg shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2 text-orange-800 mb-1">
                                                <div className="bg-orange-500 text-white rounded-full p-0.5">
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                </div>
                                                <span className="text-[12px] font-bold uppercase tracking-wider">Atenção: Conflito de Logística</span>
                                            </div>
                                            <button
                                                onClick={() => setShowConflictDetails(!showConflictDetails)}
                                                className="text-[10px] uppercase font-bold text-orange-600 hover:text-orange-800 underline decoration-orange-300 underline-offset-2"
                                            >
                                                {showConflictDetails ? 'Ocultar Detalhes' : 'Ver Endereços'}
                                            </button>
                                        </div>
                                        <div className="text-[11px] text-orange-700 leading-tight">
                                            Detectamos <strong>{locationConflicts.length} endereços</strong> com sobreposição de serviços.
                                            Verifique se um único profissional pode realizar o atendimento consolidado.
                                        </div>

                                        {showConflictDetails && (
                                            <div className="mt-2 space-y-1 pl-2 border-l-2 border-orange-200">
                                                {locationConflicts.map((c, i) => {
                                                    const firstItem = c.items[0];
                                                    return (
                                                        <div key={i} className="text-[10px] text-orange-800 flex flex-col mb-1.5 pb-1 border-b border-orange-200/50 last:border-0 last:pb-0">
                                                            <span className="font-bold">{firstItem.address}</span>
                                                            <span className="text-orange-600/80 italic mb-1">{firstItem.neighborhood}</span>
                                                            <div className="flex flex-col pl-2 border-l-2 border-orange-300/30 gap-0.5 mt-0.5">
                                                                {c.items.map((item: any) => (
                                                                    <div key={item.id} className="flex items-center justify-between text-[9px] text-orange-900 bg-orange-100/50 px-1 py-0.5 rounded">
                                                                        <span className="font-semibold truncate max-w-[100px]">{item.photographerName || item.photographer?.name || 'Pendente'}</span>
                                                                        <span className="shrink-0">{item.time || 'Sem h.'}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Single-line Ultra-compact Filters */}
                                {viewMode === 'map' && (
                                    <div className="flex flex-col gap-1.5 px-1">
                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                                            <button
                                                onClick={() => setSelectedPhotographerMap('all')}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap shadow-sm border ${selectedPhotographerMap === 'all'
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600'
                                                    }`}
                                            >
                                                Todos
                                            </button>

                                            <div className="w-px h-3 bg-slate-200 shrink-0 mx-1" />

                                            {data?.photographers.map(p => {
                                                const pColor = getMapColor(p.name, p.color);
                                                const isSelected = selectedPhotographerMap === p.id;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => setSelectedPhotographerMap(p.id)}
                                                        className={`px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap shadow-sm border flex items-center gap-1.5 ${isSelected
                                                            ? 'bg-white text-slate-800 border-2 shadow-md dark:bg-slate-800 dark:text-slate-100'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                                                            }`}
                                                        style={isSelected ? { borderColor: pColor } : {}}
                                                    >
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: pColor }}></div>
                                                        {p.name}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Ultra-compact Pending Toggle on its own line */}
                                        <div className="flex justify-start px-1">
                                            <div className="flex bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 items-center gap-4 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-widest mr-1">Filtros:</div>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={showPendingMap}
                                                            onChange={(e) => setShowPendingMap(e.target.checked)}
                                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-orange-500 focus:ring-orange-500 transition-all"
                                                        />
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Mostrar Pendentes</span>
                                                    </label>

                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <input
                                                            type="checkbox"
                                                            checked={showPhotographerBase}
                                                            onChange={(e) => setShowPhotographerBase(e.target.checked)}
                                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-500 focus:ring-blue-500 transition-all"
                                                        />
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors tracking-tight">Casa do fotógrafo</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {viewMode === 'map' && (
                                    <div key={`map-view-${selectedDate}-${selectedPhotographerMap}-${showPendingMap}-${data?.schedule?.length}`} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 overflow-hidden w-full h-[620px] relative transition-colors">
                                        {!isTimelineLoading && data ? (
                                            <DailyRouteMap
                                                schedule={data.schedule}
                                                pending={data.pending}
                                                photographers={data.photographers}
                                                filterId={selectedPhotographerMap}
                                                showPending={showPendingMap}
                                                showPhotographerBase={showPhotographerBase}
                                                onOrderClick={handleOrderClick}
                                                onActionClick={(order) => {
                                                    setSelectedOrder(order);
                                                    setConfirmModal({
                                                        isOpen: true,
                                                        order: order,
                                                        targetPhotographerId: '',
                                                        targetTime: ''
                                                    });
                                                }}
                                                selectedOrderId={selectedOrder?.id}
                                                isGlobal={false}
                                            />
                                        ) : (
                                            <div className="p-10 text-center text-slate-400 h-full flex items-center justify-center">Carregando Visão de Rotas...</div>
                                        )}
                                    </div>
                                )}

                                {viewMode === 'global_map' && (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/50 overflow-hidden w-full h-[620px] relative transition-colors">
                                        <MacroCalendarView
                                            currentDate={selectedDate}
                                            onDateSelect={(dateStr) => {
                                                setSelectedDate(dateStr);
                                                setViewMode('timeline'); // Switch back to timeline after picking a date
                                            }}
                                            getMapColor={getMapColor}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR (Nested inside main content row for proper layout) */}
                {selectedOrder && !selectedSlot && (
                    <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800/50 shadow-xl overflow-y-auto z-40 animate-in slide-in-from-right duration-300 flex flex-col transition-colors">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0 transition-colors">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-500" />
                                Sugestões Inteligentes
                            </h3>
                            <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><XCircle className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" /></button>
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

                {/* SLOT SUGGESTION SIDEBAR (Situation 2) */}
                {selectedSlot && (
                    <div className="w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800/50 shadow-xl overflow-y-auto z-40 animate-in slide-in-from-right duration-300 flex flex-col relative transition-colors">
                        <SlotSuggestionList
                            photographerId={selectedSlot.photographerId}
                            photographerName={selectedSlot.photographerName}
                            date={selectedDate}
                            time={selectedSlot.time}
                            selectedOrderId={selectedOrder?.id}
                            onSelectOrder={(orderId) => {
                                const order = data?.pending.find(p => p.id === orderId);
                                if (order) setSelectedOrder(order);
                            }}
                            onConfirm={(orderId) => {
                                const order = data?.pending.find(p => p.id === orderId);
                                if (order && selectedSlot) {
                                    setConfirmModal({
                                        isOpen: true,
                                        order: order,
                                        targetPhotographerId: selectedSlot.photographerId,
                                        targetTime: selectedSlot.time,
                                    });
                                    // We keep the slot open so context is preserved until actual confirmation
                                }
                            }}
                            onClose={() => setSelectedSlot(null)}
                        />
                    </div>
                )}

            </div>

            {/* Confirmation Modal */}
            <SchedulingModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmAssignment}
                onUnschedule={handleUnschedule}
                order={confirmModal.order}
                photographers={data?.photographers || []}
                targetPhotographerId={confirmModal.targetPhotographerId}
                onPhotographerChange={(id) => setConfirmModal({ ...confirmModal, targetPhotographerId: id })}
                targetTime={confirmModal.targetTime}
                onTimeChange={(time) => setConfirmModal({ ...confirmModal, targetTime: time })}
                selectedDate={selectedDate}
                getInitials={getInitials}
                schedule={data?.schedule || []}
                pending={data?.pending || []} // Pass pending booking
            />
        </div>
    );
}
