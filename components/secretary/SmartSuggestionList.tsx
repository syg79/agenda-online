
import React, { useEffect, useState } from 'react';
import { MapPin, Clock, ArrowRight, Star } from 'lucide-react';
import { SchedulingOpportunity } from '@/lib/services/smart-scheduling';

interface SmartSuggestionListProps {
    targetLat: number | null;
    targetLng: number | null;
    currentDate: string;
    onSelectSuggestion: (photographerId: string, time: string) => void;
}

export function SmartSuggestionList({ targetLat, targetLng, currentDate, onSelectSuggestion }: SmartSuggestionListProps) {
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
        <div className="bg-white border-l border-slate-200 h-full flex flex-col w-80 shadow-xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Sugestões Inteligentes
                </h3>
                <p className="text-xs text-slate-500 mt-1">Baseado na rota dos fotógrafos</p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {opportunities.map((opp, idx) => (
                    <div
                        key={idx}
                        className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => onSelectSuggestion(opp.photographer.id, opp.suggestedTime)}
                    >
                        {/* Header: Photographer & Distance */}
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-sm text-slate-800">{opp.photographer.name}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${opp.distanceKm < 5 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {opp.distanceKm} km
                            </span>
                        </div>

                        {/* Reference Context */}
                        <div className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate">Perto de: {opp.referenceBooking.address}</span>
                        </div>

                        {/* Recommendation */}
                        <div className="bg-slate-50 rounded border border-slate-100 p-2 flex items-center justify-between group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Sugerido</span>
                                <span className="font-bold text-blue-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {opp.suggestedTime}
                                </span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
