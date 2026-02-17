'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

export function DatePicker({ selectedDate, onDateSelect }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(selectedDate);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync view with selected date when it changes externally
    useEffect(() => {
        setViewDate(selectedDate);
    }, [selectedDate]);

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

    const handleSelect = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onDateSelect(newDate);
        setIsOpen(false);
    };

    const renderCalendarDays = () => {
        const days = [];
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        // Weekday headers
        const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

        return (
            <div className="p-4 bg-white rounded-lg shadow-xl border border-slate-200 absolute top-full left-0 mt-2 z-50 w-72 animate-in fade-in zoom-in-95 duration-100">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded-full transition"><ChevronLeft className="w-4 h-4 text-slate-600" /></button>
                    <span className="font-bold text-slate-800 text-sm">
                        {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                    </span>
                    <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded-full transition"><ChevronRight className="w-4 h-4 text-slate-600" /></button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {weekDays.map(d => (
                        <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                        const isSelected = date.toDateString() === selectedDate.toDateString();
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                            <button
                                key={day}
                                onClick={() => handleSelect(day)}
                                className={`
                                    h-8 w-8 rounded-full text-sm font-medium transition-all flex items-center justify-center
                                    ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-100 text-slate-700'}
                                    ${isToday && !isSelected ? 'text-blue-600 font-bold bg-blue-50' : ''}
                                `}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

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
            {isOpen && renderCalendarDays()}
        </div>
    );
}
