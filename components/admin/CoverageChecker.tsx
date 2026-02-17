'use client';

import { useState } from 'react';
import { Search, MapPin, CheckCircle, XCircle, Calculator } from 'lucide-react';

export default function CoverageChecker() {
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const check = async () => {
        if (!address) return;
        setLoading(true);
        setResult(null);

        try {
            // 1. Validate Address (Get Lat/Lng)
            const geoRes = await fetch('/api/address/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address })
            });
            const geoData = await geoRes.json();

            if (!geoData.latitude) {
                setResult({ error: 'Endereço não localizado.' });
                return;
            }

            // 2. Check Availability (REAL API CALL)
            const coverageRes = await fetch('/api/admin/coverage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: geoData.latitude,
                    longitude: geoData.longitude,
                    address,
                    neighborhood: geoData.neighborhood
                })
            });
            const coverageData = await coverageRes.json();

            setResult({
                geo: geoData,
                photographers: coverageData.results
            });

        } catch (e) {
            setResult({ error: 'Erro ao verificar.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Calculator size={20} className="text-blue-600" />
                Calculadora de Viabilidade (Matriz)
            </h3>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Digite o endereço completo do imóvel..."
                    className="flex-1 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    onKeyDown={e => e.key === 'Enter' && check()}
                />
                <button
                    onClick={check}
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium text-sm flex items-center gap-2"
                >
                    {loading ? 'Calculando...' : 'Verificar'}
                </button>
            </div>

            {result && result.error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <XCircle size={16} />
                    {result.error}
                </div>
            )}

            {result && result.geo && (
                <div className="space-y-4">
                    <div className="p-3 bg-green-50 text-green-800 rounded-lg text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2"><CheckCircle size={16} /> Endereço Válido</span>
                        <span className="font-mono text-xs opacity-75">{result.geo.latitude.toFixed(4)}, {result.geo.longitude.toFixed(4)}</span>
                    </div>

                    {/* REAL DATA DISPLAY */}
                    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Fotógrafo</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wide font-bold">Distância (Raio)</p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {result.photographers?.map((p: any) => (
                                <div key={p.id} className={`flex justify-between items-center p-3 ${p.status === 'COVERED' ? 'bg-white' : 'bg-slate-50 opacity-75'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${p.status === 'COVERED' ? 'bg-green-500' : p.status === 'NO_BASE' ? 'bg-slate-400' : 'bg-red-400'}`} />
                                        <span className="font-medium text-slate-700">{p.name}</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {p.status === 'NO_BASE' ? (
                                            <span className="text-xs text-slate-500 italic">Sem endereço base</span>
                                        ) : (
                                            <>
                                                <span className="text-xs text-slate-500">
                                                    {p.distanceKm} km
                                                    <span className="text-slate-400 ml-1">
                                                        (aprox. {p.durationMin} min)
                                                    </span>
                                                </span>

                                                {p.status === 'COVERED' ? (
                                                    <span className="text-green-700 font-bold text-xs bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
                                                        Atende
                                                    </span>
                                                ) : (
                                                    <span className="text-red-600 font-bold text-xs bg-red-100 px-2 py-1 rounded-full whitespace-nowrap">
                                                        Fora ({p.radius}km)
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button className="text-blue-600 text-sm font-medium hover:underline">
                            + Criar Pedido Manualmente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
