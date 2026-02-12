'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';

interface TimeBlock {
    id: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    reason?: string;
}

interface PhotographerCalendarProps {
    photographerId: string;
    initialBlocks: TimeBlock[];
}

export default function PhotographerCalendar({ photographerId, initialBlocks }: PhotographerCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Auto-hide toast
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const toggleDayBlocking = async () => {
        if (!selectedDate) return;
        setLoading(true);
        const dateStr = selectedDate.toISOString().split('T')[0];

        // Check if day is fully blocked (all working hours)
        // Simplistic approach: Check if we have blocks for 8:00, 12:00, 16:00 (sampling) or check count.
        // Better: Just providing a "Block All" button for now.

        try {
            // Strategy: Create a special "WHOLE_DAY" block OR create blocks for every slot?
            // "WHOLE_DAY" block is cleaner for DB but requires logic change in availabilityService.
            // For MVP compatibility with existing checkAvailability, let's create a block from 08:00 to 18:00.

            // Check if already has a "Whole Day" block
            const wholeDayBlock = blocks.find(b =>
                b.date.startsWith(dateStr) && b.startTime === '08:00' && b.endTime === '18:00'
            );

            if (wholeDayBlock) {
                // Unblock Day
                await fetch(`/api/photographers/${photographerId}/block`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blockId: wholeDayBlock.id }),
                });
                setBlocks(blocks.filter(b => b.id !== wholeDayBlock.id));
                showToast('Dia desbloqueado com sucesso!');
            } else {
                // Block Day
                // First remove any partial blocks to avoid duplicates/overlap errors if logic was strict (it isn't strict yet but good practice)
                // Actually, let's just add a big block. The availability logic checks "ANY block overlap".

                const res = await fetch(`/api/photographers/${photographerId}/block`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: dateStr,
                        startTime: '08:00',
                        endTime: '18:00',
                        reason: 'Dia Completo'
                    }),
                });

                if (!res.ok) throw new Error('Erro ao bloquear dia');
                const newBlock = await res.json();
                setBlocks([...blocks, newBlock]);
                showToast('Dia inteiro bloqueado!');
            }
        } catch (error) {
            showToast('Erro ao alterar bloqueio do dia', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleSlot = async (time: string) => {
        if (!selectedDate) return;

        const dateStr = selectedDate.toISOString().split('T')[0];
        const isCurrentlyBlocked = isBlocked(selectedDate, time);

        setLoading(true);
        // setError(''); // Using toast now

        try {
            if (isCurrentlyBlocked) {
                // Unblock Logic
                // Note: If the day is blocked by a "Whole Day" block (08:00-18:00), this specific slot toggle might need to split the block?
                // MVP Limitation: You can't unblock a specific slot if it's covered by a WHOLE DAY block unless we add complex splitting logic.
                // Let's rely on visual feedback.

                const block = blocks.find(b => {
                    // Exact match or contains?
                    // MVP: Exact Match logic used in isBlocked needs refinement if we want to support "Range Blocks"
                    // Current isBlocked checks: b.startTime === time.
                    // But if we have 08:00-18:00, isBlocked(09:00) returns false with current logic?
                    // Wait, let's check isBlocked implementation above.
                    // isBlocked: return blocks.some(b => b.date.startsWith(dateStr) && b.startTime === time);
                    // This ONLY matches start time. So "Whole Day" block (08:00) only blocks 08:00 visually in the grid if we don't update isBlocked.
                    return b.date.startsWith(dateStr) && b.startTime === time;
                });

                if (!block) {
                    // Check range?
                    // For now, let's stick to simple "Slot Blocking" or "Whole Day Blocking".
                    // If Whole Day, we can't unblock single slot easily.
                    showToast('Para desbloquear horários de um dia fechado, desbloqueie o dia todo primeiro.', 'error');
                    return;
                }

                const res = await fetch(`/api/photographers/${photographerId}/block`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blockId: block.id }),
                });

                if (!res.ok) throw new Error('Falha ao desbloquear');

                setBlocks(blocks.filter(b => b.id !== block.id));
                showToast('Horário liberado');

            } else {
                // Block (Create)
                const [h, m] = time.split(':').map(Number);
                const endMinutes = h * 60 + m + 30;
                const endH = Math.floor(endMinutes / 60);
                const endM = endMinutes % 60;
                const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

                const res = await fetch(`/api/photographers/${photographerId}/block`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: dateStr,
                        startTime: time,
                        endTime: endTime,
                        reason: 'Indisponível'
                    }),
                });

                if (!res.ok) throw new Error('Falha ao bloquear');

                const newBlock = await res.json();
                setBlocks([...blocks, newBlock]);
                showToast('Horário bloqueado');
            }
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Update isBlocked to handle ranges (like Whole Day)
    const isBlocked = (date: Date, time?: string) => {
        const dateStr = date.toISOString().split('T')[0];

        // Check for Whole Day Block first
        // Assuming Whole Day is 08:00 - 18:00
        const hasWholeDay = blocks.some(b =>
            b.date.startsWith(dateStr) && b.startTime === '08:00' && b.endTime === '18:00'
        );

        if (hasWholeDay) return true;

        if (!time) {
            // Check if ANY block exists for this date
            return blocks.some(b => b.date.startsWith(dateStr));
        }

        // Check specific slot match (legacy/simple blocks)
        return blocks.some(b => b.date.startsWith(dateStr) && b.startTime === time);
    };

    const generateSlots = () => {
        const slots = [];
        for (let h = 8; h < 18; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`);
            if (h !== 17 || (selectedDate?.getDay() !== 6)) {
                slots.push(`${h.toString().padStart(2, '0')}:30`);
            }
        }
        return slots;
    };

    const renderCalendar = () => {
        const days = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-10"></div>);
        }
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
            const isSelected = selectedDate?.toDateString() === date.toDateString();
            const hasBlock = isBlocked(date);

            days.push(
                <button
                    key={d}
                    onClick={() => setSelectedDate(date)}
                    className={`h-10 w-full rounded-full flex items-center justify-center text-sm transition-colors
                    ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}
                    ${hasBlock && !isSelected ? 'text-red-500 font-bold' : ''}
                `}
                >
                    {d}
                    {hasBlock && !isSelected && <div className="absolute w-1 h-1 bg-red-500 rounded-full mt-6"></div>}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="grid md:grid-cols-2 gap-8 relative">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 px-4 py-3 rounded shadow-lg z-50 text-white font-medium transition-all transform translate-y-0 opacity-100 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                    {toast.message}
                </div>
            )}

            {/* Calendar Side */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                    <h2 className="font-semibold text-lg">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 mb-2">
                    <div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {renderCalendar()}
                </div>
            </div>

            {/* Slots Side */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-slate-400" />
                        Agenda
                    </h3>
                    <button
                        onClick={toggleDayBlocking}
                        disabled={loading}
                        className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                    >
                        Bloquear Dia Todo
                    </button>
                </div>
                <p className="text-sm text-slate-500 mb-4 capitalize">
                    {selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>

                <div className="grid grid-cols-3 gap-2">
                    {generateSlots().map(time => {
                        const blocked = selectedDate ? isBlocked(selectedDate, time) : false;
                        return (
                            <button
                                key={time}
                                onClick={() => toggleSlot(time)}
                                disabled={loading}
                                className={`
                            py-2 rounded border text-sm font-medium transition-all
                            ${blocked
                                        ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:text-blue-600'
                                    }
                        `}
                            >
                                {time}
                            </button>
                        );
                    })}
                </div>
                <p className="mt-4 text-xs text-slate-500 text-center">
                    Vermelho = Indisponível (Salvo automaticamente)
                </p>
            </div>
        </div>
    );
}
