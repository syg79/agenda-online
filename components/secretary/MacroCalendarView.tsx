'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { Booking } from '@/lib/types/dashboard';

interface MacroCalendarViewProps {
    currentDate: string; // YYYY-MM-DD
    onDateSelect: (date: string) => void;
    getMapColor: (name: string, defaultColor: string) => string;
    onOrderClick?: (order: Booking) => void;
}

export default function MacroCalendarView({ currentDate, onDateSelect, getMapColor, onOrderClick }: MacroCalendarViewProps) {
    const [viewDate, setViewDate] = useState(() => {
        const [y, m, d] = currentDate.split('-');
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    });

    const [monthBookings, setMonthBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMonthData = async () => {
            setLoading(true);
            try {
                const y = viewDate.getFullYear();
                const m = viewDate.getMonth() + 1;
                const res = await fetch(`/api/secretary/dashboard?mode=month&year=${y}&month=${m}`);
                const data = await res.json();
                if (data.schedule) {
                    setMonthBookings(data.schedule);
                }
            } catch (err) {
                console.error('Failed to fetch month data', err);
            } finally {
                setLoading(false);
            }
        };

        fetchMonthData();
    }, [viewDate.getFullYear(), viewDate.getMonth()]);

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleDayClick = (dayStr: string) => {
        onDateSelect(dayStr);
    };

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Group bookings by date string (YYYY-MM-DD)
    const bookingsByDate = monthBookings.reduce((acc, booking) => {
        const d = (booking.date as unknown as string); // assuming API returns YYYY-MM-DD
        if (!acc[d]) acc[d] = [];
        acc[d].push(booking);
        return acc;
    }, {} as Record<string, Booking[]>);

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0 transition-colors">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            const now = new Date();
                            setViewDate(now);
                            onDateSelect(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
                        }}
                        className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Hoje
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"><ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" /></button>
                        <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"><ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" /></button>
                    </div>
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 capitalize">
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    {loading && <span className="animate-pulse">Atualizando...</span>}
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 transition-colors">
                {weekDays.map((d, i) => (
                    <div key={i} className={`p-2 text-center text-xs font-bold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        {d}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-7 auto-rows-fr h-full min-h-[500px]">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-slate-50/50 dark:bg-slate-900/50 border-r border-b border-slate-200 dark:border-slate-800 min-h-[120px]"></div>
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();
                        const isSelected = currentDate === dateStr;
                        const dayBookings = bookingsByDate[dateStr] || [];

                        // Sort bookings: pending first, then by time
                        const sortedBookings = [...dayBookings].sort((a, b) => {
                            const aPending = a.status === 'PENDING' || a.status === 'PENDENTE';
                            const bPending = b.status === 'PENDING' || b.status === 'PENDENTE';
                            if (aPending && !bPending) return -1;
                            if (!aPending && bPending) return 1;
                            if (a.time && b.time) return a.time.localeCompare(b.time);
                            return 0;
                        });

                        return (
                            <div
                                key={day}
                                onClick={() => handleDayClick(dateStr)}
                                className={`
                                    min-h-[120px] border-r border-b border-slate-200 dark:border-slate-800 p-1 flex flex-col gap-1 cursor-pointer transition-colors
                                    ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10 shadow-inner' : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900'}
                                `}
                            >
                                {/* Day Number */}
                                <div className="flex justify-between items-start pt-1 px-1 mb-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDayClick(dateStr);
                                        }}
                                        className={`
                                        w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors
                                        ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 hover:bg-blue-700' :
                                                isSelected ? 'text-blue-700 dark:text-blue-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'}
                                    `}>
                                        {day}
                                    </button>
                                    {dayBookings.length > 0 && (
                                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{dayBookings.length}</span>
                                    )}
                                </div>

                                {/* Events List */}
                                <div className="flex-1 overflow-y-auto max-h-[140px] space-y-1 pr-1 custom-scrollbar">
                                    {sortedBookings.map(booking => {
                                        const isPending = booking.status === 'PENDING' || booking.status === 'PENDENTE';
                                        const photographerName = (booking as any).photographerName || booking.photographer?.name || 'Indefinido';
                                        const pColor = isPending ? '#f59e0b' : getMapColor(photographerName, booking.photographer?.color || '#3B82F6');

                                        return (
                                            <div
                                                key={booking.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onOrderClick) onOrderClick(booking);
                                                }}
                                                className={`
                                                    text-[9px] p-1 rounded border-l-[3px] truncate flex items-center gap-1 leading-tight transition-opacity hover:opacity-80 cursor-pointer
                                                `}
                                                style={{
                                                    backgroundColor: `${pColor}15`,
                                                    borderColor: pColor,
                                                    color: 'inherit' // Rely on dark mode text classes below
                                                }}
                                                title={`${booking.time || 'Sem h.'} - ${booking.neighborhood ? booking.neighborhood + ' / ' : ''}${booking.clientName} (${photographerName})`}
                                            >
                                                {isPending ? (
                                                    <AlertCircle className="w-[10px] h-[10px] shrink-0 text-amber-500" />
                                                ) : (
                                                    <span className="font-bold shrink-0 text-slate-700 dark:text-slate-300">
                                                        {booking.time || '--:--'}
                                                    </span>
                                                )}
                                                <span className={`truncate font-semibold ${isPending ? 'text-amber-800 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                    {booking.neighborhood ? `${booking.neighborhood} / ` : ''}{booking.clientName}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Custom scrollbar styles for inner macro scrollbars if needed */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #475569;
                }
            `}</style>
        </div>
    );
}
