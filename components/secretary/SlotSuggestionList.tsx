
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
    selectedOrderId?: string | null;
    onConfirm: (orderId: string) => void;
    onSelectOrder: (orderId: string) => void;
    onClose: () => void;
}

export function SlotSuggestionList({ photographerId, photographerName, date, time, onSelectOrder, onClose, selectedOrderId, onConfirm }: SlotSuggestionListProps) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/scheduling/suggestions-for-slot?photographerId=${photographerId}&date=${date}&time=${time}&_t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: { 'Cache-Control': 'no-cache' }
                });
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

    const [sortBy, setSortBy] = useState<'relevance' | 'distance'>('relevance');

    const sortedSuggestions = [...suggestions].sort((a, b) => {
        if (sortBy === 'distance') {
            return a.distanceKm - b.distanceKm;
        }
        // Relevance uses the sortScore from API (which considers insertion cost)
        return (a as any).sortScore - (b as any).sortScore;
    });

    return (
        <div className="bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800/50 w-96 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300 z-50 absolute right-0 top-0 bottom-0 transition-colors">
            {/* Header */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-start transition-colors">
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

            {/* Sorting Toggle */}
            <div className="px-5 py-2 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between transition-colors">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordenar por:</span>
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-0.5 rounded-lg">
                    <button
                        onClick={() => setSortBy('relevance')}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${sortBy === 'relevance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Melhor Rota
                    </button>
                    <button
                        onClick={() => setSortBy('distance')}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${sortBy === 'distance' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Mais Próximo
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
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
                            Saindo de: {sortedSuggestions[0]?.originLabel}
                        </div>
                        {sortedSuggestions.map((s, index) => {
                            const isSelected = selectedOrderId === s.id;
                            const isBestRoute = sortBy === 'relevance' && index === 0;

                            return (
                                <div
                                    key={s.id}
                                    onClick={() => {
                                        if (isSelected) {
                                            onConfirm(s.id);
                                        } else {
                                            onSelectOrder(s.id);
                                        }
                                    }}
                                    className={`
                                        border p-3 rounded-xl cursor-pointer transition-all group relative overflow-hidden
                                        ${isSelected
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-md ring-1 ring-blue-300 dark:ring-blue-800/50'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm'
                                        }
                                        ${isBestRoute ? 'ring-2 ring-emerald-400 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/20' : ''}
                                    `}
                                >
                                    {isBestRoute && (
                                        <div className="absolute top-0 left-0 bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-br-lg z-10">
                                            Recomendado
                                        </div>
                                    )}
                                    <div className="absolute top-0 right-0 p-2 bg-slate-50 rounded-bl-xl border-b border-l text-[10px] font-bold text-slate-500">
                                        {s.distanceKm} km
                                    </div>

                                    <div className="pr-12 pt-2">
                                        <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-blue-800' : 'text-slate-800'}`}>{s.clientName}</h4>
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

                                    <div className="mt-3 pt-3 border-t border-slate-100/50 flex justify-between items-center">
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium truncate max-w-[120px]">
                                            {s.neighborhood}
                                        </span>

                                        {isSelected && (
                                            <span className="text-xs font-bold text-blue-600 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
                                                Clique novamente para agendar <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}
