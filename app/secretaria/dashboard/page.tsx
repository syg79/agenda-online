
'use client';

import React, { useEffect, useState } from 'react';
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
    MoreVertical,
    CheckCircle,
    XCircle,
    Menu,
    Search
} from 'lucide-react';
import Link from 'next/link';
import { SmartSuggestionList } from '@/components/secretary/SmartSuggestionList';
import { DatePicker } from '@/components/secretary/DatePicker';

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
    address: string;
    neighborhood: string;
    protocol?: string; // Optional protocol
    status: string;
    services: string[];
    latitude?: number | null;
    longitude?: number | null;
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
    const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState<string>(initialDate);

    // Data State
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // State for Selection (Click-to-Select)
    const [selectedOrder, setSelectedOrder] = useState<Booking | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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

    const fetchData = async (date: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/secretary/dashboard?date=${date}`);
            if (!res.ok) throw new Error('Falha ao carregar dados');
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate]);

    const handleDateChange = (days: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + days); // Correct date math handles rollover
        const newDate = d.toISOString().split('T')[0];
        setSelectedDate(newDate);
        // Update URL without refresh
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

        // Open Confirmation
        setConfirmModal({
            isOpen: true,
            order: selectedOrder,
            targetPhotographerId: photographerId,
            targetTime: time,
        });
        // Don't clear selection yet, wait for confirm/cancel
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
            // We could use a toast, but for now just refresh
            fetchData(selectedDate);
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
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">

            {/* Sidebar: Pending List & Search */}
            <div className="w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 z-20 shadow-xl">
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button className="flex-1 py-3 text-sm font-semibold text-orange-600 border-b-2 border-orange-600 bg-orange-50">
                        Pendentes ({data?.pending.length || 0})
                    </button>
                    <button className="flex-1 py-3 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50">
                        Agendados
                    </button>
                    {/* Add "Realizados" etc later if needed */}
                </div>

                {/* Filter / Search */}
                <div className="p-3 bg-slate-50 border-b border-slate-100">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por nome, #ref ou endereço..."
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                    {isLoading && <p className="text-center text-slate-400 py-4">Carregando...</p>}

                    {!isLoading && data?.pending
                        .filter(order => {
                            if (!searchTerm) return true;
                            const term = searchTerm.toLowerCase();
                            return (
                                order.clientName.toLowerCase().includes(term) ||
                                (order.protocol && order.protocol.toLowerCase().includes(term)) ||
                                order.id.toLowerCase().includes(term) ||
                                order.neighborhood.toLowerCase().includes(term) ||
                                order.address.toLowerCase().includes(term)
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
                                    {/* Header: Ref & Client */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                                                #{order.protocol || order.id.substring(0, 6)}
                                            </span>
                                            <h3 className={`font-bold text-sm truncate max-w-[140px] ${isSelected ? 'text-orange-900' : 'text-slate-800'}`}>
                                                {order.clientName}
                                            </h3>
                                        </div>
                                        {isSelected && <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />}
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

                                    {/* Footer: Services & Status */}
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {order.services.map(s => (
                                            <span key={s} className="text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                {s}
                                            </span>
                                        ))}
                                        <span className="ml-auto text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                            PENDENTE
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                    {!isLoading && data?.pending.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Tudo em dia!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Area: Timeline */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Header: Date Navigation */}
                <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-slate-800">Painel da Secretaria</h1>
                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                            <button onClick={() => handleDateChange(-1)} className="p-1 hover:bg-white rounded-md transition hover:shadow-sm">
                                <ChevronLeft className="w-5 h-5 text-slate-600" />
                            </button>

                            <DatePicker
                                selectedDate={new Date(selectedDate)}
                                onDateSelect={(date) => {
                                    // Adjust for timezone offset to avoid -1 day error
                                    // The DatePicker returns a Date object at 00:00 local time
                                    // We want YYYY-MM-DD
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const newDateStr = `${year}-${month}-${day}`;

                                    setSelectedDate(newDateStr);
                                    window.history.replaceState(null, '', `?date=${newDateStr}`);
                                }}
                            />

                            <button onClick={() => handleDateChange(1)} className="p-1 hover:bg-white rounded-md transition hover:shadow-sm">
                                <ChevronRight className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-500">
                        {data?.schedule.length || 0} agendamentos hoje
                    </div>
                    <Link href="/agendar" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                        + Novo Pedido
                    </Link>
                </div>

                {/* Timeline Grid */}
                <div className="flex-1 overflow-auto bg-slate-50 p-6 relative">

                    {/* Manual Scheduling Hint */}
                    {selectedOrder && (
                        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <Clock className="w-5 h-5" />
                            <div>
                                <span className="font-bold">Modo Manual: </span>
                                Selecione um horário livre na grade abaixo para agendar
                                <span className="font-bold ml-1">{selectedOrder.clientName}</span>.
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-w-[1000px]">

                        {/* Header Row (Times) */}
                        <div className="flex border-b border-slate-100">
                            <div className="w-48 p-4 shrink-0 bg-slate-50 border-r border-slate-100 font-semibold text-slate-500 text-sm uppercase tracking-wider">
                                Fotógrafo
                            </div>
                            {timeSlots.map(hour => (
                                <div key={hour} className="flex-1 border-r border-slate-100 p-2 text-center text-xs font-bold text-slate-400">
                                    {hour}:00
                                </div>
                            ))}
                        </div>

                        {/* Photographer Rows */}
                        {isLoading ? (
                            <div className="p-10 text-center text-slate-400">Carregando agenda...</div>
                        ) : (
                            data?.photographers.map(p => (
                                <div key={p.id} className="flex border-b border-slate-100 h-28 relative group">
                                    {/* Photographer Info */}
                                    <div className="w-48 p-4 shrink-0 border-r border-slate-100 bg-white flex flex-col justify-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: p.color || '#3b82f6' }}>
                                                {getInitials(p.name)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800">{p.name}</div>
                                                <div className="text-xs text-slate-400 capitalize">{p.neighborhoods ? 'Setor definido' : 'Toda região'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Slots (Click Zones) */}
                                    {timeSlots.map(hour => {
                                        const timeStr = `${hour < 10 ? '0' : ''}${hour}:00`;

                                        // Simple logic to find items in this hour (ignoring duration overlap for MVP visual)
                                        const items = data.schedule.filter(s =>
                                            s.photographerId === p.id &&
                                            parseInt(s.time.split(':')[0]) === hour
                                        );

                                        const isHoverable = !!selectedOrder; // Only hover effect if something is selected

                                        return (
                                            <div
                                                key={hour}
                                                className={`
                                        flex-1 border-r border-slate-50 relative transition-colors
                                        ${isHoverable ? 'cursor-pointer hover:bg-orange-50 hover:ring-inset hover:ring-2 hover:ring-orange-200' : 'bg-white'}
                                    `}
                                                onClick={() => handleSlotClick(p.id, timeStr)}
                                            >
                                                {/* Render Assigned Items */}
                                                {items.map(item => (
                                                    <div
                                                        key={item.id}
                                                        className="absolute top-1 left-1 right-1 bottom-1 rounded-md p-2 text-xs border border-l-4 shadow-sm overflow-hidden z-10 hover:z-20 hover:shadow-md transition-all cursor-default"
                                                        style={{
                                                            backgroundColor: `${p.color}15`, // 10% opacity
                                                            borderColor: p.color || '#3b82f6',
                                                            color: '#1e293b'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()} // Prevent triggering slot click
                                                    >
                                                        <div className="font-bold truncate">{item.time} - {item.clientName}</div>
                                                        <div className="flex items-center gap-1 mt-1 opacity-75">
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="truncate">{item.neighborhood}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}

                    </div>
                </div>
            </div>

            {/* Right Sidebar: Smart Suggestions */}
            {
                selectedOrder && (
                    <div className="z-20 h-full flex shrink-0 transition-all duration-300">
                        <SmartSuggestionList
                            targetLat={selectedOrder.latitude ?? null}
                            targetLng={selectedOrder.longitude ?? null}
                            currentDate={selectedDate}
                            onSelectSuggestion={(photographerId, time) => {
                                setConfirmModal({
                                    isOpen: true,
                                    order: selectedOrder,
                                    targetPhotographerId: photographerId,
                                    targetTime: time
                                });
                            }}
                        />
                    </div>
                )
            }

            {/* Confirmation Modal */}
            {
                confirmModal.isOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Confirmar Agendamento</h3>
                            <div className="space-y-4 mb-6">
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Cliente</div>
                                    <div className="font-medium text-slate-800">{confirmModal.order?.clientName}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Fotógrafo</div>
                                        <div className="font-medium text-slate-800">
                                            {data?.photographers.find(p => p.id === confirmModal.targetPhotographerId)?.name}
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Horário</div>
                                        <div className="font-medium text-slate-800">{confirmModal.targetTime}</div>
                                    </div>
                                </div>

                                {/* FUTURE: Show Distance / Viability Warning here */}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                                    className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmAssignment}
                                    className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
}
