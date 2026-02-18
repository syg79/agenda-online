'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    minDate?: Date;
}


export function CalendarInline({ selectedDate, onDateSelect, minDate, className }: DatePickerProps & { className?: string }) {
    const [viewDate, setViewDate] = useState(selectedDate);

    // Sync view with selected date when it changes externally
    useEffect(() => {
        setViewDate(selectedDate);
    }, [selectedDate]);

    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    // Helper to check if date is disabled
    const isDateDisabled = (date: Date) => {
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0) return true; // Block Sundays

        if (!minDate) return false;
        const target = new Date(date);
        target.setHours(0, 0, 0, 0);
        const min = new Date(minDate);
        min.setHours(0, 0, 0, 0);
        return target < min;
    };

    const handleSelect = (day: number) => {
        // Create date string YYYY-MM-DD and append time to force local interpretation
        const y = viewDate.getFullYear();
        const m = String(viewDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const newDate = new Date(`${y}-${m}-${d}T00:00:00`);

        if (isDateDisabled(newDate)) return;
        onDateSelect(newDate);
    };

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className={`p-5 bg-white rounded-xl border border-slate-200 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-full transition"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                <span className="font-extrabold text-slate-800 text-base capitalize">
                    {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-full transition"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-2 text-center mb-3">
                {weekDays.map((d, i) => (
                    <div key={i} className={`text-[10px] font-bold ${i === 0 ? 'text-red-400' : 'text-slate-400'} uppercase tracking-tighter`}>{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isDisabled = isDateDisabled(date);

                    return (
                        <button
                            key={day}
                            onClick={() => !isDisabled && handleSelect(day)}
                            disabled={isDisabled}
                            className={`
                                h-8 w-8 rounded-full text-sm font-medium transition-all flex items-center justify-center
                                ${isSelected ? 'bg-orange-600 text-white shadow-md' : ''}
                                ${!isSelected && !isDisabled ? 'hover:bg-orange-50 text-slate-700 hover:text-orange-700' : ''}
                                ${isToday && !isSelected ? 'text-orange-600 font-bold bg-orange-50' : ''}
                                ${isDisabled ? 'text-slate-300 cursor-not-allowed decoration-slate-200 opacity-50' : ''}
                            `}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function DatePicker({ selectedDate, onDateSelect, minDate }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-all border
                    ${isOpen ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-100 border-transparent hover:bg-white hover:shadow-sm text-slate-700'}
                `}
            >
                <CalendarIcon className="w-4 h-4" />
                <span className="font-medium text-sm">
                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-72 animate-in fade-in zoom-in-95 duration-100 shadow-xl">
                    <CalendarInline selectedDate={selectedDate} onDateSelect={(d) => { onDateSelect(d); setIsOpen(false); }} minDate={minDate} />
                </div>
            )}
        </div>
    );
}
