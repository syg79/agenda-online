
import * as React from 'react';
import { useEffect, useState } from 'react';
import { MapPin, Navigation, Calendar, User, Clock } from 'lucide-react';

interface Suggestion {
    id: string;
    clientName: string;
    protocol: string;
    services: string[];
    neighborhood: string;
    address: string;
    distanceKm: number;
    originLabel: string;
    duration: number;
}

interface SlotSuggestionListProps {
    photographerId: string;
    photographerName?: string;
    date: string;
    time: string;
    onSelectOrder: (orderId: string) => void;
    onClose: () => void;
}

export function SlotSuggestionList({ photographerId, photographerName, date, time, onSelectOrder, onClose }: SlotSuggestionListProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/scheduling/suggestions-for-slot?photographerId=${photographerId}&date=${date}&time=${time}`);
                const data = await res.json();
                if (data.suggestions) {
                    setSuggestions(data.suggestions);
                }
            } catch (error) {
                console.error("Failed to load suggestions", error);
            } finally {
                setLoading(false);
            }
        };

        if (photographerId && date && time) {
            fetchSuggestions();
        }
    }, [photographerId, date, time]);

    return (
        <div className="bg-white border-l border-slate-200 w-96 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 z-50 absolute right-0 top-0 bottom-0">
            {/* Header */}
            <div className="p-5 bg-slate-50 border-b flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        <Navigation className="w-5 h-5 text-blue-600" />
                        Oportunidades de Rota
                    </h3>
                    <div className="flex flex-col mt-2 text-xs text-slate-500 gap-1">
                        <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-medium text-slate-700">{photographerName || 'Fotógrafo'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border inline-flex self-start">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{date.split('-').reverse().slice(0, 2).join('/')}</span>
                            <span className="text-slate-300">|</span>
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-bold text-blue-600">{time}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition">
                    <span className="sr-only">Fechar</span>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-medium">Calculando distâncias...</span>
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                        Nenhum pedido pendente próximo à rota deste fotógrafo neste horário.
                    </div>
                ) : (
                    <>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                            Saindo de: {suggestions[0]?.originLabel}
                        </div>
                        {suggestions.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => onSelectOrder(s.id)}
                                className="bg-white border border-slate-200 p-3 rounded-xl hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-2 bg-slate-50 rounded-bl-xl border-b border-l text-[10px] font-bold text-slate-500">
                                    {s.distanceKm} km
                                </div>

                                <div className="pr-12">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{s.clientName}</h4>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{s.protocol}</div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-1">
                                    {s.services && s.services.map((svc, i) => (
                                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                            {svc}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-2 flex items-start gap-2 text-xs text-slate-600">
                                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                                    <span className="line-clamp-2 leading-relaxed">{s.address}</span>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center group-hover:border-blue-100 transition-colors">
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium truncate max-w-[120px]">
                                        {s.neighborhood}
                                    </span>
                                    <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                        Selecionar <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
