import * as React from 'react';
import { Clock } from 'lucide-react';
import { Booking } from '@/lib/types/dashboard';

type SchedulingBannerProps = {
    selectedOrder: Booking;
    onCancel: () => void;
    onScheduleManual: () => void;
};

export function SchedulingBanner({ selectedOrder, onCancel, onScheduleManual }: SchedulingBannerProps) {
    return (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 shrink-0">
            <div className="flex items-center gap-3 text-left">
                <Clock className="w-5 h-5 text-orange-500 shrink-0" />
                <div className="text-sm">
                    <span className="font-bold">Agendando: </span>
                    Selecione um horário na grade para <span className="font-bold">{selectedOrder.clientName}</span>.
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onScheduleManual}
                    className="text-[11px] bg-white text-blue-600 px-4 py-1.5 rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition font-black uppercase tracking-wider shadow-sm"
                >
                    Agendar
                </button>
                <button
                    onClick={onCancel}
                    className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200 transition font-bold uppercase tracking-wider"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
