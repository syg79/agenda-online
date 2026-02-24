
import * as React from 'react';
import { useEffect, useState } from 'react';
import { MapPin, Clock, ArrowRight, Star, AlertCircle } from 'lucide-react';
import { SchedulingOpportunity } from '@/lib/services/smart-scheduling';

interface SmartSuggestionListProps {
    targetLat: number | null;
    targetLng: number | null;
    currentDate: string;
    onSelectSuggestion: (photographerId: string, time: string) => void;
    onSelectOpportunity?: (orderId: string) => void;
}

export function SmartSuggestionList({ targetLat, targetLng, currentDate, onSelectSuggestion, onSelectOpportunity }: SmartSuggestionListProps) {
    const [opportunities, setOpportunities] = useState<SchedulingOpportunity[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (targetLat && targetLng) {
            fetchOpportunities();
        } else {
            setOpportunities([]);
        }
    }, [targetLat, targetLng, currentDate]);

    const fetchOpportunities = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/scheduling/opportunities?lat=${targetLat}&lng=${targetLng}&date=${currentDate}`);
            const data = await res.json();
            if (data.opportunities) {
                setOpportunities(data.opportunities);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!targetLat || !targetLng) return (
        <div className="p-4 text-center text-slate-400 text-sm">
            Selecione um pedido com endereço validado para ver sugestões.
        </div>
    );

    if (loading) return <div className="p-4 text-center text-slate-500 animate-pulse">Calculando rotas...</div>;

    if (opportunities.length === 0) return (
        <div className="p-4 text-center text-slate-500 text-sm">
            Nenhuma oportunidade próxima encontrada para hoje.
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800/50 h-full flex flex-col w-72 shadow-xl overflow-hidden min-w-[288px] transition-colors">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {opportunities.map((opp, idx) => {
                    const isPending = opp.photographer.id === 'PENDING';
                    return (
                        <div
                            key={idx}
                            className={`
                                border rounded-lg p-3 transition-all group relative
                                ${isPending
                                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-sm cursor-default'
                                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md cursor-pointer'
                                }
                            `}
                            onClick={() => !isPending && onSelectSuggestion(opp.photographer.id, opp.suggestedTime)}
                        >
                            {/* Header: Photographer & Distance */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`font-semibold text-sm ${isPending ? 'text-slate-800 dark:text-slate-200' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {opp.photographer.name}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opp.distanceKm < 5 ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-amber-500/20 text-yellow-700 dark:text-amber-400'}`}>
                                    {opp.distanceKm} km
                                </span>
                                {isPending && <span className="text-[9px] text-amber-600 dark:text-amber-500 font-bold uppercase ml-auto">Pendente</span>}
                            </div>

                            {/* Reference Context */}
                            <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="truncate">Perto de: {opp.referenceBooking.address}</span>
                            </div>

                            {/* Recommendation */}
                            <div
                                className={`
                                    rounded border p-2 flex items-center justify-between transition-colors mt-2
                                    ${isPending
                                        ? 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700/80 cursor-pointer shadow-sm group'
                                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800/50'
                                    }
                                `}
                                onClick={(e) => {
                                    if (isPending && onSelectOpportunity) {
                                        e.stopPropagation();
                                        onSelectOpportunity(opp.referenceBooking.id);
                                    }
                                }}
                            >
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">
                                        {isPending ? 'Ver este pedido' : 'Sugerido'}
                                    </span>
                                    <span className={`font-bold flex items-center gap-1 ${isPending ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                        {isPending ? (
                                            <>
                                                <ArrowRight className="w-3 h-3" />
                                                <span className="text-[10.5px] truncate">
                                                    {opp.suggestedTime === 'Juntar' ? 'Atender Junto' : `Próximo: ${opp.suggestedTime}`}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="w-3 h-3" />
                                                {opp.suggestedTime}
                                            </>
                                        )}
                                    </span>
                                </div>
                                <ArrowRight className={`w-4 h-4 ${isPending ? 'text-slate-400 group-hover:text-amber-500' : 'text-slate-300 group-hover:text-blue-500'}`} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
