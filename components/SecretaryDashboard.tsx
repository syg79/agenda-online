'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Grid, List, Save, X, Edit2, Trash2 } from 'lucide-react';

interface Booking {
    id: string;
    date: string;
    time: string;
    duration: number;
    clientName: string;
    protocol: string;
    services: string[];
    address?: string; // Add address
    neighborhood?: string;
    photographerId?: string | null;
}

interface TimeBlock {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
}

interface Photographer {
    id: string;
    name: string;
    email: string;
    bookings: Booking[];
    blocks: TimeBlock[];
}

export default function SecretaryDashboard({ photographers, unassignedBookings = [] }: { photographers: Photographer[], unassignedBookings?: Booking[] }) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
    const [selectedBooking, setSelectedBooking] = useState<Booking & { photographer?: Photographer } | null>(null);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Booking>>({});

    const handlePrev = () => {
        const next = new Date(selectedDate);
        if (viewMode === 'day') next.setDate(selectedDate.getDate() - 1);
        else next.setDate(selectedDate.getDate() - 7);
        setSelectedDate(next);
    };

    const handleNext = () => {
        const next = new Date(selectedDate);
        if (viewMode === 'day') next.setDate(selectedDate.getDate() + 1);
        else next.setDate(selectedDate.getDate() + 7);
        setSelectedDate(next);
    };

    const dateStr = selectedDate.toISOString().split('T')[0];

    // Generate Hourly slots (08:00 - 18:00)
    const hours: { label: string; val: number }[] = [];
    for (let h = 8; h <= 18; h++) {
        hours.push({
            label: `${h.toString().padStart(2, '0')}:00`,
            val: h
        });
    }

    const getWeekDates = () => {
        const curr = new Date(selectedDate);
        const first = curr.getDate() - curr.getDay();
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const next = new Date(curr);
            next.setDate(first + i);
            dates.push(next);
        }
        return dates;
    };

    const weekDates = getWeekDates();

    const getItemsForPhotographer = (photographer: Photographer, targetDateStr: string) => {
        const renderItem = (type: 'booking' | 'block', item: any) => {
            let startH, startM, duration;

            if (type === 'booking') {
                const [h, m] = item.time.split(':').map(Number);
                startH = h;
                startM = m;
                duration = item.duration;
            } else {
                const [h, m] = item.startTime.split(':').map(Number);
                const [eh, em] = item.endTime.split(':').map(Number);
                startH = h;
                startM = m;
                duration = (eh * 60 + em) - (h * 60 + m);
            }

            const startOfDayMin = 8 * 60;
            const itemStartMin = startH * 60 + startM;
            const offsetMin = itemStartMin - startOfDayMin;

            if (offsetMin < 0) return null;

            if (viewMode === 'day') {
                const HOUR_WIDTH = 100;
                const left = (offsetMin / 60) * HOUR_WIDTH;
                const width = (duration / 60) * HOUR_WIDTH;

                return (
                    <div
                        key={item.id}
                        onClick={() => {
                            if (type === 'booking') {
                                setSelectedBooking({ ...item, photographer });
                                setIsEditing(false);
                            }
                        }}
                        className={`absolute top-2 bottom-2 rounded px-2 text-xs flex flex-col justify-center cursor-pointer hover:brightness-95 transition-all shadow-sm overflow-hidden truncate
                            ${type === 'booking' ? 'bg-blue-100 border-l-4 border-blue-600 text-blue-900 z-10' : 'bg-red-100 border-l-4 border-red-500 text-red-900 opacity-80'}
                        `}
                        style={{ left: `${left}px`, width: `${width}px` }}
                        title={type === 'booking' ? `${item.clientName} (${item.time})` : item.reason}
                    >
                        <span className="font-bold truncate">{type === 'booking' ? item.clientName : 'Bloqueio'}</span>
                        <span className="text-[10px] truncate">{type === 'booking' ? item.time : item.reason}</span>
                    </div>
                );
            } else {
                return (
                    <div key={item.id} className="mb-1 p-1 bg-blue-100 rounded text-xs truncate" onClick={() => {
                        if (type === 'booking') {
                            setSelectedBooking({ ...item, photographer });
                            setIsEditing(false);
                        }
                    }}>
                        {type === 'booking' ? `${item.time} ${item.clientName}` : 'Bloqueio'}
                    </div>
                );
            }
        };

        const todaysBookings = photographer.bookings.filter(b => b.date === targetDateStr).map(b => renderItem('booking', b));
        const todaysBlocks = photographer.blocks.filter(b => b.date === targetDateStr).map(b => renderItem('block', b));

        return [...todaysBlocks, ...todaysBookings];
    };

    const currentUnassigned = unassignedBookings.filter(b => {
        if (viewMode === 'day') return b.date === dateStr;
        const start = weekDates[0].toISOString().split('T')[0];
        const end = weekDates[6].toISOString().split('T')[0];
        return b.date >= start && b.date <= end;
    });

    const handleEditClick = () => {
        if (!selectedBooking) return;
        setEditForm({
            date: selectedBooking.date,
            time: selectedBooking.time,
            address: selectedBooking.address || '',
            photographerId: selectedBooking.photographer?.id || '',
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!selectedBooking) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });

            if (!res.ok) throw new Error('Falha ao atualizar');

            alert('Agendamento atualizado e sincronizado!');
            setIsEditing(false);
            setSelectedBooking(null);
            router.refresh();
        } catch (error) {
            alert('Erro ao salvar alterações.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (!selectedBooking || !confirm('Tem certeza que deseja cancelar? Esta ação notificará o cliente e o Tadabase.')) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
                method: 'DELETE', // Using DELETE verb but likely handled as soft delete in backend
            });
            if (!res.ok) throw new Error('Falha ao cancelar');

            alert('Agendamento cancelado com sucesso!');
            setSelectedBooking(null);
            router.refresh();
        } catch (error) {
            alert('Erro ao cancelar agendamento.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Painel da Secretaria</h1>
                    <div className="flex gap-4 text-sm mt-1">
                        <a href="/agendar" target="_blank" className="text-blue-600 font-medium hover:underline flex items-center gap-1">
                            + Novo Agendamento
                        </a>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('day')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'day' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Diário
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${viewMode === 'week' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Semanal
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handlePrev} className="p-2 hover:bg-slate-100 rounded-full border"><ChevronLeft className="w-5 h-5" /></button>
                    <div className="flex items-center gap-2 px-2 min-w-[240px] justify-center">
                        <CalendarIcon className="w-5 h-5 text-slate-500" />
                        <span className="font-semibold text-lg capitalize">
                            {viewMode === 'day'
                                ? selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
                                : `Semana de ${weekDates[0].toLocaleDateString('pt-BR', { day: 'numeric', month: '2-digit' })}`
                            }
                        </span>
                    </div>
                    <button onClick={handleNext} className="p-2 hover:bg-slate-100 rounded-full border"><ChevronRight className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Unassigned Section */}
            {currentUnassigned.length > 0 && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h3 className="text-yellow-800 font-bold flex items-center gap-2 mb-3">
                        ⚠️ Agendamentos Sem Fotógrafo ({currentUnassigned.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentUnassigned.map(b => (
                            <div key={b.id} onClick={() => { setSelectedBooking({ ...b }); setIsEditing(false); }} className="bg-white border hover:border-blue-400 p-3 rounded-lg shadow-sm cursor-pointer transition flex justify-between items-center group">
                                <div>
                                    <div className="font-bold text-slate-800">{b.clientName}</div>
                                    <div className="text-xs text-slate-500 flex gap-2">
                                        <span>📅 {b.date.split('-').reverse().join('/')}</span>
                                        <span>⏰ {b.time}</span>
                                    </div>
                                </div>
                                <button className="text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                                    Ver Detalhes
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DAY VIEW */}
            {viewMode === 'day' && (
                <div className="bg-white rounded-xl shadow-sm border overflow-x-auto pb-4">
                    <div className="min-w-[1200px]">
                        {/* Header Row */}
                        <div className="flex border-b bg-slate-50/80 sticky top-0 z-20 backdrop-blur-sm">
                            <div className="w-56 p-4 font-semibold text-slate-600 border-r bg-slate-50 sticky left-0 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                Fotógrafo
                            </div>
                            <div className="flex-1 relative h-12">
                                {hours.map((h, i) => (
                                    <div key={h.val} className="absolute top-3 text-xs font-semibold text-slate-400 border-l border-slate-200 pl-2 h-full" style={{ left: `${i * 100}px` }}>
                                        {h.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rows */}
                        {photographers.map(photographer => (
                            <div key={photographer.id} className="flex border-b hover:bg-slate-50/50 transition-colors h-28 relative group">
                                <div className="w-56 p-4 border-r bg-white sticky left-0 z-20 flex flex-col justify-center group-hover:bg-slate-50/50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                    <span className="font-bold text-slate-800">{photographer.name}</span>
                                    <span className="text-xs text-slate-500 truncate">{photographer.email}</span>
                                    <div className="mt-2 flex gap-2 text-[10px] text-slate-400">
                                        <span>{photographer.bookings.filter(b => b.date === dateStr).length} agendamentos</span>
                                    </div>
                                </div>
                                <div className="flex-1 relative bg-[repeating-linear-gradient(90deg,transparent,transparent_99px,#f1f5f9_100px)]">
                                    {getItemsForPhotographer(photographer, dateStr)}
                                </div>
                            </div>
                        ))}
                        {photographers.length === 0 && (
                            <div className="p-8 text-center text-slate-500">Nenhum fotógrafo ativo encontrado.</div>
                        )}
                    </div>
                </div>
            )}

            {/* WEEK VIEW */}
            {viewMode === 'week' && (
                <div className="grid grid-cols-7 border rounded-xl overflow-hidden shadow-sm bg-white">
                    {weekDates.map((date, i) => {
                        const dStr = date.toISOString().split('T')[0];
                        const isToday = dStr === new Date().toISOString().split('T')[0];

                        return (
                            <div key={i} className={`min-h-[400px] border-r last:border-r-0 ${isToday ? 'bg-blue-50/30' : ''}`}>
                                <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-50'}`}>
                                    <div className="text-xs uppercase text-slate-500">{date.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                                    <div className="text-lg">{date.getDate()}</div>
                                </div>
                                <div className="p-2 space-y-2">
                                    {photographers.map(p => {
                                        const items = p.bookings.filter(b => b.date === dStr);
                                        if (items.length === 0) return null;
                                        return (
                                            <div key={p.id} className="text-xs mb-2">
                                                <div className="font-bold text-slate-400 mb-1 ml-1">{p.name}</div>
                                                {items.map(b => (
                                                    <div key={b.id} onClick={() => { setSelectedBooking({ ...b, photographer: p }); setIsEditing(false); }} className="bg-white border hover:border-blue-300 p-2 rounded shadow-sm mb-1 cursor-pointer transition">
                                                        <div className="font-bold text-blue-800">{b.time}</div>
                                                        <div className="truncate">{b.clientName}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    })}
                                    {currentUnassigned.filter(b => b.date === dStr).length > 0 && (
                                        <div className="mt-4 pt-2 border-t border-dashed">
                                            <div className="font-bold text-yellow-600 mb-1 ml-1">Sem Fotógrafo</div>
                                            {currentUnassigned.filter(b => b.date === dStr).map(b => (
                                                <div key={b.id} onClick={() => { setSelectedBooking({ ...b }); setIsEditing(false); }} className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded shadow-sm mb-1 cursor-pointer transition">
                                                    <div className="font-bold">{b.time}</div>
                                                    <div className="truncate">{b.clientName}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Details Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold mb-6 flex justify-between items-center text-slate-800">
                            {isEditing ? 'Editar Agendamento' : 'Detalhes do Agendamento'}
                            <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 p-1">
                                <span className="sr-only">Fechar</span>
                                <X className="w-5 h-5" />
                            </button>
                        </h3>

                        {!isEditing ? (
                            // VIEW MODE
                            <div className="space-y-5">
                                <div className="bg-slate-50 p-4 rounded-lg border">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Cliente</label>
                                    <p className="font-bold text-lg text-slate-900">{selectedBooking.clientName}</p>
                                    <p className="text-xs text-slate-500 mt-1">Protocolo: {selectedBooking.protocol}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 border rounded-lg">
                                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><CalendarIcon className="w-3 h-3" /> Data</label>
                                        <p className="font-medium">{selectedBooking.date.split('-').reverse().join('/')}</p>
                                        <p className="font-medium">{selectedBooking.time}</p>
                                    </div>
                                    <div className="p-3 border rounded-lg">
                                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-1"><User className="w-3 h-3" /> Fotógrafo</label>
                                        <p className={`font-medium ${selectedBooking.photographer ? 'text-slate-900' : 'text-yellow-600'}`}>
                                            {selectedBooking.photographer ? selectedBooking.photographer.name : 'Não atribuído'}
                                        </p>
                                    </div>
                                </div>

                                {selectedBooking.address && (
                                    <div className="p-3 border rounded-lg">
                                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">📍 Endereço</label>
                                        <p className="font-medium">{selectedBooking.address}</p>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 border-t">
                                    <button
                                        className="flex-1 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2"
                                        onClick={handleEditClick}
                                    >
                                        <Edit2 className="w-4 h-4" /> Editar
                                    </button>
                                    <button
                                        className="flex-1 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition border border-red-100 flex items-center justify-center gap-2"
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        <Trash2 className="w-4 h-4" /> Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // EDIT MODE
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fotógrafo</label>
                                    <select
                                        className="w-full border rounded-lg p-2.5 bg-white"
                                        value={editForm.photographerId || ''}
                                        onChange={e => setEditForm({ ...editForm, photographerId: e.target.value })}
                                    >
                                        <option value="">-- Selecione ou Deixe sem --</option>
                                        {photographers.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                                        <input
                                            type="date"
                                            className="w-full border rounded-lg p-2.5"
                                            value={editForm.date?.toString().split("T")[0] || ''} // Handle date string properly
                                            onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                                        <input
                                            type="time"
                                            className="w-full border rounded-lg p-2.5"
                                            value={editForm.time || ''}
                                            onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                                    <input
                                        className="w-full border rounded-lg p-2.5"
                                        value={editForm.address || ''}
                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4 border-t mt-6">
                                    <button
                                        className="flex-1 py-2.5 bg-slate-100 rounded-lg text-slate-700 font-medium hover:bg-slate-200 transition"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                        onClick={handleSave}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
