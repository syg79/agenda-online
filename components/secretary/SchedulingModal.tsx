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
    onConfirm: (data?: any) => void;
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

    // Local State for Editing
    const [clientName, setClientName] = React.useState('');
    const [clientEmail, setClientEmail] = React.useState('');
    const [clientPhone, setClientPhone] = React.useState('');
    const [notes, setNotes] = React.useState('');
    const [localServices, setLocalServices] = React.useState<string[]>([]);

    // Initialize state when order changes
    React.useEffect(() => {
        if (order) {
            setClientName(order.clientName || '');
            setClientEmail(order.clientEmail || '');
            setClientPhone(order.clientPhone || '');
            setNotes(order.notes || '');
            setLocalServices(order.services || []);
        }
    }, [order]);

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

                            {/* 2. Hora (15m Intervals) */}
                            <div className="flex items-center gap-2 group/item">
                                <div className="w-8 h-8 bg-orange-50 rounded flex items-center justify-center text-orange-600 group-hover/item:bg-orange-600 group-hover/item:text-white transition-colors">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <select
                                        value={targetTime}
                                        onChange={(e) => onTimeChange(e.target.value)}
                                        className="w-28 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[15px] font-bold text-slate-800 focus:border-blue-500 focus:outline-none transition-all cursor-pointer appearance-none"
                                    >
                                        {Array.from({ length: 13 * 4 }).map((_, i) => {
                                            const startHour = 8; // 08:00
                                            const totalMinutes = i * 15;
                                            const hour = Math.floor(totalMinutes / 60) + startHour;
                                            const minute = totalMinutes % 60;
                                            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                            if (hour > 20) return null; // Limit to 20:00
                                            return <option key={timeString} value={timeString}>{timeString}</option>
                                        })}
                                    </select>
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

                            {/* 4. Serviços (EDITÁVEL via Checkbox) */}
                            <div className="flex items-start gap-2 group/item">
                                <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center text-slate-400 mt-0.5 shrink-0">
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div className="flex-1 flex flex-col gap-1 min-h-[48px] max-h-[80px] overflow-y-auto pr-1">
                                    {/* Serviços (EDITÁVEL via Checkbox) */}
                                    <div className="flex flex-wrap gap-1.5 mt-1 pb-2">
                                        {Array.from(new Set(['Fotos', 'Vídeo', 'Drone', 'Tour 360', 'Planta Baixa', ...localServices])).map(serviceLabel => {
                                            const isSelected = localServices.includes(serviceLabel);
                                            return (
                                                <label key={serviceLabel} className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setLocalServices([...localServices, serviceLabel]);
                                                            } else {
                                                                setLocalServices(localServices.filter(s => s !== serviceLabel));
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-[10px] font-bold">{serviceLabel}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 my-2"></div>

                            {/* 6. Cliente & Contato (Compacto) */}
                            <div className="flex items-start gap-2 group/item">
                                <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center text-slate-400 mt-1">
                                    <User className="w-3.5 h-3.5" />
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    {/* Line 1: Label */}
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Cliente / Ref</span>

                                    {/* Line 2: Name Input + Ref Badge */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            placeholder="Nome do Cliente"
                                            className="flex-1 px-2 py-1 text-[11px] font-bold text-slate-600 border border-slate-200 rounded bg-slate-50 focus:outline-none cursor-default"
                                            type="text"
                                            value={clientName}
                                            readOnly
                                        />
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-1 rounded border border-slate-200 whitespace-nowrap">
                                            #{order?.protocol || order?.id.substring(0, 6)}
                                        </span>
                                    </div>

                                    {/* Line 3: Phone Input */}
                                    <input
                                        placeholder="Telefone (WhatsApp)"
                                        className="w-full px-2 py-1 text-[10px] text-slate-600 border border-slate-200 rounded bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
                                        type="tel"
                                        value={clientPhone}
                                        onChange={(e) => setClientPhone(e.target.value)}
                                    />

                                    {/* Line 4: Broker Details (Field 177) - Read Only */}
                                    {order?.brokerDetails && (
                                        <div className="mt-0.5 pt-0.5 border-t border-slate-50 flex items-center gap-1">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">Corretor:</span>
                                            <div className="text-[10px] text-slate-600 italic select-all truncate">
                                                {order.brokerDetails}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 7. Observações (EDITÁVEL) */}
                            <div className="flex items-start gap-2 group/item">
                                <div className="w-6 h-6 bg-slate-50 rounded flex items-center justify-center text-slate-400 mt-1">
                                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                                </div>
                                <div className="flex flex-col gap-1 w-full">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Obs:</span>
                                    <textarea
                                        placeholder="Informações adicionais..."
                                        rows={3}
                                        className="w-full px-3 py-2 text-[11px] font-medium text-slate-700 border border-slate-200 rounded bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all resize-none leading-tight"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>
                            </div>
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

                    {/* Move to Waiting (New Button) */}
                    {isRescheduling && onUnschedule && (
                        <button
                            onClick={async () => {
                                if (!order?.id) return;
                                try {
                                    await fetch(`/api/bookings/${order.id}/status`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: 'WAITING' })
                                    });
                                    onClose();
                                    // Ideally refresh parent, but onClose generally triggers re-fetch in parent
                                    window.location.reload(); // Simple brute force refresh for now to ensure state sync
                                } catch (err) {
                                    alert('Erro ao mover para aguardando');
                                }
                            }}
                            className="px-4 py-2 text-orange-600 font-bold hover:bg-orange-50 rounded-lg transition-all border border-orange-200 bg-white text-[10px] uppercase tracking-wider flex items-center gap-1"
                        >
                            <Clock className="w-3 h-3" />
                            Mover p/ Aguardando
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
                        onClick={() => onConfirm({
                            clientName,
                            clientEmail,
                            clientPhone,
                            notes,
                            services: localServices
                        })}
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

