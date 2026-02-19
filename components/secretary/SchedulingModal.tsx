'use client';

import * as React from 'react';
import {
    XCircle,
    MapPin,
    Info,
    Calendar as CalendarIcon,
    Clock,
    User,
    Truck,
    FileText,
    Briefcase
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MiniMap = dynamic(() => import('@/components/secretary/MiniMap').then(mod => mod.default), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Carregando Mapa...</div>
});

import { Booking, Photographer } from '@/lib/types/dashboard';

type SchedulingModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    order: Booking | null;
    photographers: Photographer[];
    targetPhotographerId: string;
    onPhotographerChange: (id: string) => void;
    targetTime: string;
    onTimeChange: (time: string) => void;
    selectedDate: string;
    getInitials: (name: string) => string;
    schedule: Booking[];
    pending: Booking[]; // New prop
    onUnschedule?: () => void;
};

export function SchedulingModal({
    isOpen,
    onClose,
    onConfirm,
    onUnschedule, // New prop
    order,
    photographers,
    targetPhotographerId,
    onPhotographerChange,
    targetTime,
    onTimeChange,
    selectedDate,
    getInitials,
    schedule
}: SchedulingModalProps) {
    const router = useRouter();
    if (!isOpen) return null;

    const isPastDate = new Date(selectedDate + 'T23:59:59') < new Date();
    const isRescheduling = order?.status === 'CONFIRMED' || order?.status === 'AGENDADO';
    const originalTime = order?.time;
    const originalDate = order?.date ? new Date(order.date).toLocaleDateString('pt-BR') : '';

    return (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-md transition-all animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-0 max-w-4xl w-full overflow-hidden animate-in zoom-in duration-200 border border-slate-200">
                {/* Modal Header: Bairro - Endereço */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center group">
                    <div className="flex flex-col text-left">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {order?.neighborhood && `${order.neighborhood} - `}{order?.address}
                        </h3>
                        {order?.complement && (
                            <div className="text-[11px] font-medium text-slate-500 ml-6 flex items-center gap-1">
                                <Info className="w-3 h-3 opacity-50" />
                                {order.complement}
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-600">
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                {/* Modal Body: Two Columns */}
                <div className="flex flex-col md:flex-row h-[420px] overflow-hidden">
                    {/* Left Column: Form & Details */}
                    <div className="flex-1 p-5 space-y-4 overflow-hidden border-r border-slate-100 bg-white flex flex-col justify-between">
                        <div className="space-y-3">
                            {/* 1. Dia */}
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
                                        value={targetTime}
                                        onChange={(e) => onTimeChange(e.target.value)}
                                        className="w-28 bg-white border border-slate-200 rounded-lg px-3 py-1 text-[15px] font-bold text-slate-800 focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* 3. Fotógrafo */}
                            <div className="flex items-center gap-2 group/item">
                                <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 group-hover/item:bg-slate-400 group-hover/item:text-white transition-colors">
                                    <User className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <select
                                        value={targetPhotographerId}
                                        onChange={(e) => onPhotographerChange(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[14px] font-bold text-slate-800 focus:border-blue-500 focus:outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        {photographers.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* 4. Serviços */}
                            <div className="flex items-start gap-2 group/item">
                                <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 mt-0.5 shrink-0">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div className="flex-1 flex flex-wrap gap-1 items-start min-h-[48px]">
                                    {order?.services.map(s => (
                                        <span key={s} className="text-[10px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                                            {s}
                                        </span>
                                    ))}
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
                                    <span className="text-[11px] font-bold text-slate-600">#{order?.protocol || order?.id.substring(0, 6)}</span>
                                </div>
                            </div>

                            {/* 6. Cliente */}
                            <div className="flex items-center gap-2 group/item">
                                <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                                    <Briefcase className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Cliente</span>
                                    <span className="text-[11px] font-bold text-slate-800 truncate max-w-[150px]">{order?.clientName}</span>
                                </div>
                            </div>

                            {/* 7. Broker Contact (Mapped to Notes) */}
                            {order?.notes && (
                                <div className="flex items-center gap-2 group/item">
                                    <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center text-slate-400">
                                        <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Contato</span>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-bold text-slate-800 truncate max-w-[150px] whitespace-pre-wrap leading-tight">
                                                {order.notes}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: MiniMap */}
                    <div className="flex-1 bg-slate-50 relative overflow-hidden">
                        {(order?.latitude && order?.longitude) ? (
                            <div className="w-full h-full">
                                <MiniMap
                                    lat={order.latitude}
                                    lng={order.longitude}
                                    label={order.clientName}
                                    // isHighlighted removed
                                    otherBookings={schedule}
                                    photographers={photographers}
                                    targetPhotographerId={targetPhotographerId}
                                    targetTime={targetTime}
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

                {/* Reschedule Warning Banner */}
                {isRescheduling && (
                    <div className="bg-amber-50 border-y border-amber-100 px-6 py-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-600" />
                        <div className="text-[11px] text-amber-700">
                            <span className="font-bold">Atenção:</span> Este pedido já está agendado para <strong>{originalDate} às {originalTime}</strong>.
                            Ao confirmar, você estará <span className="underline">reagendando</span> para o novo horário.
                        </div>
                    </div>
                )}

                {/* Modal Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex gap-3">
                    <button
                        onClick={() => {
                            if (order?.protocol) {
                                router.push(`/agendar?protocol=${order.protocol}`);
                            } else if (order?.id) {
                                router.push(`/agendar?id=${order.id}`);
                            }
                        }}
                        className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg transition-all border border-slate-200 bg-white text-[11px] uppercase tracking-wider"
                    >
                        Editar
                    </button>

                    {/* Unschedule Button (Only if rescheduling) */}
                    {isRescheduling && onUnschedule && (
                        <button
                            onClick={onUnschedule}
                            className="px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-lg transition-all border border-red-200 bg-white text-[11px] uppercase tracking-wider"
                        >
                            Desagendar (Voltar p/ Pendente)
                        </button>
                    )}

                    <div className="flex-1"></div>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-all border border-slate-200 bg-white text-[11px] uppercase tracking-wider"
                    >
                        Fechar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isPastDate}
                        className={`px-6 py-2 font-black text-[11px] uppercase tracking-widest rounded-lg transition-all shadow-md active:scale-95 ${isPastDate
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                            }`}
                    >
                        {isRescheduling ? 'Confirmar Reagendamento' : 'Confirmar Agendamento'}
                    </button>
                </div>
            </div>
        </div>
    );
}

