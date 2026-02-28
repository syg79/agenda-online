'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Search, Building2, MapPin, Ruler, Car, BedDouble, Store, Calendar, DollarSign, FileText, Loader2, CheckCircle2, AlertCircle, X, Clock, History } from 'lucide-react';

interface PropertyResult {
    ref: string;
    address: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    propertyType: string | null;
    area: number | null;
    bedrooms: number | null;
    parkingSpaces: number | null;
    storeName: string | null;
    price: number | null;
    latitude: number | null;
    longitude: number | null;
    building: string | null;
    complement: string | null;
    description: string | null;
    situation: string | null;
    listingDate: string | null;
    expiryDate: string | null;
    popupPrice: string | null;
    internalNotes: string | null;
}

interface ApolarRefSearchProps {
    compact?: boolean;
    isAdmin?: boolean;
    onPropertyFound?: (data: any, bookings: any[]) => void;
    onClear?: () => void;
    onError?: (error: string) => void;
}

export default function ApolarRefSearch({ onPropertyFound, onError, onClear, compact = false, isAdmin = false }: ApolarRefSearchProps) {
    const [ref, setRef] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressStep, setProgressStep] = useState('');
    const [result, setResult] = useState<PropertyResult | null>(null);
    const [error, setError] = useState('');
    const [source, setSource] = useState<'cache' | 'scrape' | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const abortRef = useRef<AbortController | null>(null);

    const isMaintenanceWindow = useMemo(() => {
        const now = new Date();
        const brHour = parseInt(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }));
        return brHour >= 2 && brHour < 6;
    }, []);

    const handleSearch = async (forceSearch = false) => {
        const cleanRef = ref.trim();
        if (!/^\d{6}$/.test(cleanRef)) {
            setError('Referência inválida. Deve conter exatamente 6 dígitos.');
            return;
        }

        setIsSearching(true);
        setProgress(0);
        setProgressStep(forceSearch ? 'Forçando atualização...' : 'Verificando...');
        setError('');
        setResult(null);
        setSource(null);

        abortRef.current = new AbortController();

        try {
            // 1. POST to create job (or get cache hit)
            const response = await fetch('/api/apolarbot/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ref: cleanRef, force: forceSearch }),
                signal: abortRef.current.signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao buscar imóvel');
            }

            const data = await response.json();

            // Cache hit — instant result
            if (data.source === 'cache') {
                setSource('cache');
                setProgress(100);
                setProgressStep('Dados encontrados!');
                setResult(data.data);
                setBookings(data.bookings || []);
                onPropertyFound?.(data.data, data.bookings || []);
                return;
            }

            // 2. Poll for progress
            const jobId = data.jobId;
            if (!jobId) throw new Error('Erro interno: jobId não retornado');

            setProgressStep('Iniciando scraping...');
            setProgress(5);

            const poll = async (): Promise<void> => {
                if (abortRef.current?.signal.aborted) return;

                const statusRes = await fetch(`/api/apolarbot/status?jobId=${jobId}`, {
                    signal: abortRef.current!.signal
                });
                const statusData = await statusRes.json();

                if (statusData.status === 'complete') {
                    setSource('scrape');
                    setProgress(100);
                    setProgressStep('Concluído!');
                    setResult(statusData.data);
                    setBookings(statusData.bookings || []);
                    onPropertyFound?.(statusData.data, statusData.bookings || []);
                    return;
                }

                if (statusData.status === 'error') {
                    throw new Error(statusData.error || 'Erro no scraping');
                }

                // Still processing — update progress and poll again
                setProgress(statusData.percent || 0);
                setProgressStep(statusData.step || 'Processando...');

                await new Promise(r => setTimeout(r, 3000));
                return poll();
            };

            await poll();
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            const msg = err.message || 'Erro ao buscar imóvel';
            setError(msg);
            onError?.(msg);
        } finally {
            setIsSearching(false);
        }
    };

    const handleClear = () => {
        setRef('');
        setResult(null);
        setProgress(0);
        setProgressStep('');
        setError('');
        setSource(null);
        setBookings([]);
        onClear?.();
    };

    const handleCancel = () => {
        abortRef.current?.abort();
        setIsSearching(false);
        setProgress(0);
        setProgressStep('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSearching) handleSearch(false);
    };

    const formatPrice = (price: number | null) => {
        if (!price) return '—';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(price);
    };

    return (
        <div className="space-y-3">
            {/* Input Row */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Referência Apolar <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={ref}
                            onChange={(e) => setRef(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            onKeyDown={handleKeyDown}
                            placeholder="00000"
                            maxLength={6}
                            disabled={isSearching}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg tracking-widest font-mono disabled:bg-slate-100"
                        />
                    </div>
                    {!isSearching ? (
                        <button
                            onClick={() => handleSearch(false)}
                            disabled={ref.trim().length !== 6}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                        >
                            Buscar
                        </button>
                    ) : (
                        <button
                            onClick={handleCancel}
                            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                        >
                            Cancelar
                        </button>
                    )}
                </div>

                {isMaintenanceWindow && !result && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        Busca disponível após 06:00
                    </p>
                )}
            </div>

            {/* Progress Bar */}
            {isSearching && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3 mb-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm font-medium text-blue-800">{progressStep}</span>
                        <span className="text-xs text-blue-500 ml-auto">{progress}%</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Result Card */}
            {result && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="font-bold text-emerald-800">
                                REF {result.ref}
                            </span>
                            {source === 'cache' && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Dados encontrados!</span>
                                    <button
                                        onClick={() => handleSearch(true)}
                                        title="Recarregar dados (limpar cache)"
                                        className="p-1 hover:bg-emerald-100 text-emerald-600 rounded-md transition-colors"
                                    >
                                        <History className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}
                            {source === 'scrape' && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Busca Online Completa</span>
                            )}
                        </div>
                        <button onClick={handleClear} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className={compact ? 'grid grid-cols-2 gap-2 text-sm' : 'grid grid-cols-2 md:grid-cols-3 gap-3 text-sm'}>
                        {result.address && (
                            <div className="flex items-start gap-2 col-span-2">
                                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-slate-800 font-medium">{result.address}</span>
                                    {result.neighborhood && <span className="text-slate-500"> — {result.neighborhood}</span>}
                                    {result.zipCode && <span className="text-slate-400 text-xs ml-1">({result.zipCode})</span>}
                                </div>
                            </div>
                        )}

                        {result.complement && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                                <span className="text-slate-700 font-medium">{result.complement}</span>
                            </div>
                        )}

                        {/* Technical/Admin details only show for isAdmin */}
                        {isAdmin && (
                            <>
                                {result.building && (
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className="text-slate-700">{result.building}</span>
                                    </div>
                                )}

                                {result.propertyType && (
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className="text-slate-700">{result.propertyType}</span>
                                    </div>
                                )}

                                {result.area && (
                                    <div className="flex items-center gap-2">
                                        <Ruler className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className="text-slate-700">{result.area} m²</span>
                                    </div>
                                )}

                                {result.bedrooms !== null && (
                                    <div className="flex items-center gap-2">
                                        <BedDouble className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className="text-slate-700">{result.bedrooms} quarto{result.bedrooms !== 1 ? 's' : ''}</span>
                                    </div>
                                )}

                                {result.parkingSpaces !== null && (
                                    <div className="flex items-center gap-2">
                                        <Car className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className="text-slate-700">{result.parkingSpaces} vaga{result.parkingSpaces !== 1 ? 's' : ''}</span>
                                    </div>
                                )}

                                {result.storeName && (
                                    <div className="flex items-center gap-2">
                                        <Store className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className="text-slate-700">Loja {result.storeName}</span>
                                    </div>
                                )}

                                {result.price && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className="text-slate-700">{formatPrice(result.price)}</span>
                                    </div>
                                )}

                                {result.situation && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span className={`text-sm font-medium ${result.situation === 'Vendido' ? 'text-red-600' : result.situation === 'Disponível' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {result.situation}
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Booking History Warning */}
                    {bookings.length > 0 && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 animate-in fade-in">
                            <div className="flex items-center gap-2 mb-2">
                                <History className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-medium text-amber-800">
                                    Já existe{bookings.length > 1 ? 'm' : ''} {bookings.length} pedido{bookings.length > 1 ? 's' : ''} para este imóvel
                                </span>
                            </div>
                            <p className="text-xs text-amber-700 leading-tight mb-2">
                                Ao confirmar um novo horário para este imóvel, cancelaremos automaticamente a reserva pendente abaixo.
                            </p>
                            <div className="space-y-1.5">
                                {bookings.map((b: any) => {
                                    const date = new Date(b.date);
                                    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
                                    const dateStr = date.toLocaleDateString('pt-BR');
                                    const statusMap: Record<string, { label: string; color: string }> = {
                                        'CONFIRMED': { label: 'Agendado', color: 'text-blue-700 bg-blue-100' },
                                        'PENDING': { label: 'Pendente', color: 'text-amber-700 bg-amber-100' },
                                        'COMPLETED': { label: 'Realizado', color: 'text-emerald-700 bg-emerald-100' },
                                        'CANCELLED': { label: 'Cancelado', color: 'text-red-700 bg-red-100' },
                                        'WAITING_RETURN': { label: 'Aguardando retorno', color: 'text-purple-700 bg-purple-100' },
                                    };
                                    const st = statusMap[b.status] || { label: b.status, color: 'text-slate-700 bg-slate-100' };

                                    // Translate service IDs to friendly names
                                    const serviceLabels: Record<string, string> = {
                                        'photo': 'FOTOS',
                                        'video_landscape': 'VÍDEO (Horizontal)',
                                        'video_portrait': 'VÍDEO (Vertical)',
                                        'drone_photo': 'DRONE FOTOS',
                                        'drone_photo_video': 'DRONE FOTO+VÍDEO'
                                    };

                                    return (
                                        <div key={b.id} className="flex flex-col gap-0.5 text-sm">
                                            <div className="flex items-center gap-1.5 font-medium text-amber-900">
                                                <span className="capitalize">{st.label}: {dayName}, {dateStr} {b.time ? `- às ${b.time}` : ''}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {(b.services || []).map((s: string) => (
                                                    <span key={s} className="text-xs font-extrabold text-amber-800">
                                                        {serviceLabels[s] || s.toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-sm text-amber-700 mt-2 font-medium">
                                Deseja criar um novo pedido mesmo assim? Continue preenchendo o formulário abaixo.
                            </p>
                        </div>
                    )}

                    {!compact && result.description && (
                        <details className="mt-3 text-sm">
                            <summary className="cursor-pointer text-slate-500 hover:text-slate-700 transition-colors">
                                Descritivo do imóvel
                            </summary>
                            <p className="mt-2 text-slate-600 leading-relaxed bg-white/60 rounded p-3 text-xs">
                                {result.description}
                            </p>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
}
