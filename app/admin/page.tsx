'use client';

import React, { useState, useEffect } from 'react';
import { getAdminData, updatePhotographerNeighborhoods, updatePhotographerServices, updatePhotographerLocation, updatePhotographerColor, updatePhotographerBase } from './actions';

// --- Curitiba Administrative Regions Mapping ---
const CURITIBA_REGIONS: Record<string, string[]> = {
    "Matriz": ["Ahú", "Alto da Glória", "Alto da XV", "Batel", "Bigorrilho", "Bom Retiro", "Cabral", "Centro", "Centro Cívico", "Cristo Rei", "Hugo Lange", "Jardim Botânico", "Jardim Social", "Juvevê", "Mercês", "Prado Velho", "Rebouças", "São Francisco"],
    "Boa Vista": ["Abranches", "Atuba", "Bacacheri", "Bairro Alto", "Barreirinha", "Boa Vista", "Cachoeira", "Pilarzinho", "Santa Cândida", "São Lourenço", "Taboão", "Tarumã", "Tingui"],
    "Cajuru": ["Cajuru", "Capão da Imbuia", "Guabirotuba", "Jardim das Américas", "Uberaba"],
    "Portão": ["Água Verde", "Campo Quitéria", "Fanny", "Fazendinha", "Guaíra", "Lindóia", "Novo Mundo", "Parolin", "Portão", "Santa Quitéria", "Seminário", "Vila Izabel"],
    "Santa Felicidade": ["Butiatuvinha", "Campina do Siqueira", "Campo Comprido", "Cascatinha", "Lamenha Pequena", "Mossunguê", "Orleans", "Santa Felicidade", "Santo Inácio", "São Braz", "São João", "Vista Alegre"],
    "Boqueirão": ["Alto Boqueirão", "Boqueirão", "Hauer", "Xaxim"],
    "Pinheirinho": ["Capão Raso", "Fanny", "Lindóia", "Novo Mundo", "Pinheirinho"],
    "Bairro Novo": ["Ganchinho", "Sítio Cercado", "Umbará"],
    "CIC": ["Augusta", "Cidade Industrial de Curitiba", "Riviera", "São Miguel"],
    "Tatuquara": ["Campo de Santana", "Caximba", "Tatuquara"]
};

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('skills');
    const [photographers, setPhotographers] = useState<any[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
    const [selectedPhotographerId, setSelectedPhotographerId] = useState<string | null>(null);
    const [activeServiceTab, setActiveServiceTab] = useState('photo'); // 'photo', 'video', 'drone'
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAdminData().then(data => {
            setPhotographers(data.photographers);
            setNeighborhoods(data.neighborhoods);
            setIsLoading(false);
        });
    }, []);

    const handleServiceToggle = async (photographerId: string, service: string) => {
        const photographer = photographers.find(p => p.id === photographerId);
        if (!photographer) return;

        let newServices = [...photographer.services];
        // Special 'ALL' logic for Services
        if (service === 'ALL') {
            if (newServices.includes('ALL')) {
                newServices = []; // Deselect All
            } else {
                newServices = ['photo', 'video', 'drone', 'video_portrait', 'video_landscape', 'ALL']; // Select All common
            }
        } else {
            if (newServices.includes(service)) {
                newServices = newServices.filter(s => s !== service);
            } else {
                newServices.push(service);
            }
        }

        // Optimistic Update
        setPhotographers(prev => prev.map(p => p.id === photographerId ? { ...p, services: newServices } : p));

        await updatePhotographerServices(photographerId, newServices);
    };

    const handleNeighborhoodToggle = async (photographerId: string, neighborhood: string, serviceContext: string) => {
        const photographer = photographers.find(p => p.id === photographerId);
        if (!photographer) return;

        let currentCoverage = photographer.neighborhoods;
        if (Array.isArray(currentCoverage) || !currentCoverage) {
            currentCoverage = {};
        } else {
            currentCoverage = { ...currentCoverage }; // Clone
        }

        let serviceNeighborhoods = currentCoverage[serviceContext] || [];

        // Special logic for "ALL" token used as Select All Helper
        if (neighborhood === 'ALL') {
            // If all are already selected (length == neighborhoods.length), Deselect All
            // Else, Select All (fill with neighborhoods array)
            if (serviceNeighborhoods.length === neighborhoods.length) {
                serviceNeighborhoods = [];
            } else {
                serviceNeighborhoods = [...neighborhoods];
            }
        } else {
            // Normal Toggle
            if (serviceNeighborhoods.includes('ALL')) {
                serviceNeighborhoods = [...neighborhoods];
                serviceNeighborhoods = serviceNeighborhoods.filter((n: string) => n !== 'ALL');
            }

            if (serviceNeighborhoods.includes(neighborhood)) {
                serviceNeighborhoods = serviceNeighborhoods.filter((n: string) => n !== neighborhood);
            } else {
                serviceNeighborhoods.push(neighborhood);
            }
        }

        currentCoverage[serviceContext] = serviceNeighborhoods;
        setPhotographers(prev => prev.map(p => p.id === photographerId ? { ...p, neighborhoods: currentCoverage } : p));
        await updatePhotographerNeighborhoods(photographerId, currentCoverage);
    };

    const handleRegionSelect = async (photographerId: string, regionName: string, serviceContext: string) => {
        if (!regionName) return;
        const photographer = photographers.find(p => p.id === photographerId);
        if (!photographer) return;

        const targetNeighborhoods = CURITIBA_REGIONS[regionName] || [];
        if (targetNeighborhoods.length === 0) return;

        let currentCoverage = photographer.neighborhoods;
        if (Array.isArray(currentCoverage) || !currentCoverage) {
            currentCoverage = {};
        } else {
            currentCoverage = { ...currentCoverage };
        }

        let serviceNeighborhoods = currentCoverage[serviceContext] || [];

        // Add all neighborhoods from the region that aren't already selected
        const newSet = new Set([...serviceNeighborhoods, ...targetNeighborhoods]);
        // Remove 'ALL' if present as we are working with specific list
        if (newSet.has('ALL')) newSet.delete('ALL');

        // If result is effectively ALL (75), maybe keep it explicit list
        currentCoverage[serviceContext] = Array.from(newSet);

        setPhotographers(prev => prev.map(p => p.id === photographerId ? { ...p, neighborhoods: currentCoverage } : p));
        await updatePhotographerNeighborhoods(photographerId, currentCoverage);
    };


    if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando dados...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Administração</h1>
                    <p className="text-slate-500">Gerenciamento de Habilidades e Regiões</p>
                </div>

                {/* Top Tabs */}
                <div className="space-y-4">
                    <div className="flex space-x-1 rounded-xl bg-slate-200 p-1 w-fit">
                        {['skills', 'regions', 'geolocation'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-32 rounded-lg py-2.5 text-sm font-medium leading-5 transition 
                  ${activeTab === tab
                                        ? 'bg-white text-blue-700 shadow'
                                        : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                                    }`}
                            >
                                {tab === 'skills' ? 'Habilidades' : tab === 'regions' ? 'Regiões' : 'Geolocalização'}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4">
                        {/* SKILLS TAB */}
                        {activeTab === 'skills' && (
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-6 border-b">
                                    <h3 className="text-xl font-semibold text-slate-800">Habilidades dos Fotógrafos</h3>
                                    <p className="text-sm text-slate-500 mt-1">Selecione as capacidades técnicas (equipamento/know-how).</p>
                                </div>
                                <div className="p-6">
                                    <div className="border rounded-lg divide-y">
                                        <div className="p-4 bg-slate-50 font-medium grid grid-cols-5 gap-4 text-sm text-slate-600">
                                            <div>Fotógrafo</div>
                                            <div className="text-center">Foto</div>
                                            <div className="text-center">Vídeo</div>
                                            <div className="text-center">Drone</div>
                                            <div className="text-center">Tudo (ALL)</div>
                                        </div>
                                        {photographers.map((p) => (
                                            <div key={p.id} className="p-4 grid grid-cols-5 gap-4 items-center hover:bg-slate-50 transition">
                                                <div className="font-medium text-slate-800">{p.name}</div>
                                                <div className="flex justify-center"><input type="checkbox" checked={p.services.includes('photo') || p.services.includes('ALL')} onChange={() => handleServiceToggle(p.id, 'photo')} className="w-5 h-5 accent-blue-600" /></div>
                                                <div className="flex justify-center"><input type="checkbox" checked={p.services.includes('video_landscape') || p.services.includes('ALL')} onChange={() => handleServiceToggle(p.id, 'video_landscape')} className="w-5 h-5 accent-blue-600" /></div>
                                                <div className="flex justify-center"><input type="checkbox" checked={p.services.includes('drone_photo') || p.services.includes('ALL')} onChange={() => handleServiceToggle(p.id, 'drone_photo')} className="w-5 h-5 accent-blue-600" /></div>
                                                <div className="flex justify-center"><input type="checkbox" checked={p.services.includes('ALL')} onChange={() => handleServiceToggle(p.id, 'ALL')} className="w-5 h-5 accent-blue-600" /></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* REGIONS TAB */}
                        {activeTab === 'regions' && (
                            <div className="bg-white rounded-lg border shadow-sm p-6">
                                <div className="flex gap-6 h-[600px]">
                                    {/* Left: Photographer List */}
                                    <div className="w-1/4 border-r pr-6 space-y-2 overflow-y-auto">
                                        <h3 className="font-semibold text-slate-700 mb-4">Fotógrafo</h3>
                                        {photographers.map((p: any) => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPhotographerId(p.id)}
                                                className={`w-full text-left px-4 py-3 rounded-lg border transition flex justify-between items-center ${selectedPhotographerId === p.id ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Right: Coverage Configuration */}
                                    <div className="flex-1 flex flex-col">
                                        {!selectedPhotographerId ? (
                                            <div className="h-full flex items-center justify-center text-slate-400 italic">
                                                Selecione um fotógrafo para editar a área de atuação.
                                            </div>
                                        ) : (
                                            (() => {
                                                const p = photographers.find(x => x.id === selectedPhotographerId);
                                                const coverage = (p && !Array.isArray(p.neighborhoods) && p.neighborhoods) ? p.neighborhoods : {};
                                                const currentList = coverage[activeServiceTab] || [];
                                                const isAll = (currentList.length === neighborhoods.length) && (neighborhoods.length > 0);

                                                // Service Tabs
                                                const services = [
                                                    { id: 'photo', label: '📸 Foto' },
                                                    { id: 'video_landscape', label: '🎥 Vídeo' },
                                                    { id: 'drone_photo', label: '🚁 Drone' },
                                                    { id: 'tour_360', label: '🔄 Tour 360' }
                                                ];

                                                return (
                                                    <>
                                                        <div className="flex items-center justify-between mb-6">
                                                            <h3 className="font-bold text-lg text-slate-800">Área de Atuação: {p.name}</h3>
                                                            <div className="flex bg-slate-100 rounded-lg p-1">
                                                                {services.map(s => (
                                                                    <button
                                                                        key={s.id}
                                                                        onClick={() => setActiveServiceTab(s.id)}
                                                                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeServiceTab === s.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                                    >
                                                                        {s.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 overflow-hidden flex flex-col">
                                                            {/* Header Controls */}
                                                            <div className="bg-blue-50/50 p-4 rounded-lg mb-4 border border-blue-100 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <h4 className="font-semibold text-blue-900">
                                                                            Cobertura para {services.find(s => s.id === activeServiceTab)?.label}
                                                                        </h4>
                                                                        <p className="text-xs text-blue-600">
                                                                            {isAll ? 'Atende Curitiba inteira (todos os bairros selecionados).' : `${currentList.length} bairros selecionados.`}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-blue-200 shadow-sm transition hover:bg-blue-50 cursor-pointer" onClick={() => handleNeighborhoodToggle(p.id, 'ALL', activeServiceTab)}>
                                                                        <input
                                                                            type="checkbox"
                                                                            id="all_regions"
                                                                            checked={isAll}
                                                                            readOnly
                                                                            className="w-5 h-5 accent-blue-600 cursor-pointer pointer-events-none"
                                                                        />
                                                                        <label className="text-sm font-bold text-slate-700 cursor-pointer pointer-events-none">
                                                                            Atende Toda Curitiba
                                                                        </label>
                                                                    </div>
                                                                </div>

                                                                {/* Regional Dropdown Helper */}
                                                                <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                                                                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Adicionar Regional:</span>
                                                                    <select
                                                                        className="text-sm border-blue-200 rounded px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        onChange={(e) => {
                                                                            const val = e.target.value;
                                                                            if (val) {
                                                                                handleRegionSelect(p.id, val, activeServiceTab);
                                                                                e.target.value = ""; // Reset dropdown
                                                                            }
                                                                        }}
                                                                    >
                                                                        <option value="">Selecione...</option>
                                                                        {Object.keys(CURITIBA_REGIONS).map(region => (
                                                                            <option key={region} value={region}>{region}</option>
                                                                        ))}
                                                                    </select>
                                                                    <span className="text-xs text-blue-400 italic ml-2">Ao selecionar, os bairros da regional são adicionados.</span>
                                                                </div>
                                                            </div>

                                                            {/* Neighborhood Grid */}
                                                            <div className="flex-1 overflow-y-auto pr-2">
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    {neighborhoods.sort().map((n: string) => (
                                                                        <label key={n} className={`flex items-center gap-2 p-2 rounded cursor-pointer transition border ${currentList.includes(n) ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent'}`}>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={currentList.includes(n)}
                                                                                onChange={() => handleNeighborhoodToggle(p.id, n, activeServiceTab)}
                                                                                className="w-4 h-4 accent-blue-600"
                                                                            />
                                                                            <span className={`text-sm ${currentList.includes(n) ? 'text-blue-800 font-medium' : 'text-slate-700'}`}>{n}</span>
                                                                        </label>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                );
                                            })()
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* GEOLOCATION TAB */}
                        {activeTab === 'geolocation' && (
                            <div className="bg-white rounded-lg border shadow-sm p-6">
                                <div className="flex gap-6 h-[600px]">
                                    {/* Left: Photographer List */}
                                    <div className="w-1/4 border-r pr-6 space-y-2 overflow-y-auto">
                                        <h3 className="font-semibold text-slate-700 mb-4">Fotógrafo</h3>
                                        {photographers.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPhotographerId(p.id)}
                                                className={`w-full text-left px-4 py-3 rounded-lg border transition flex justify-between items-center ${selectedPhotographerId === p.id ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                <span>{p.name}</span>
                                                {p.latitude && p.longitude ? (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">OK</span>
                                                ) : (
                                                    <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">?</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Right: Geolocation Config */}
                                    <div className="flex-1 flex flex-col">
                                        {!selectedPhotographerId ? (
                                            <div className="h-full flex items-center justify-center text-slate-400 italic">
                                                Selecione um fotógrafo para configurar a localização.
                                            </div>
                                        ) : (
                                            <GeolocationConfig
                                                photographer={photographers.find(x => x.id === selectedPhotographerId)}
                                                onUpdate={(id, data) => {
                                                    setPhotographers(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer Map */}
                <div className="mt-12 border-t pt-8 pb-12">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Mapa de Regionais de Curitiba</h3>
                    <p className="text-slate-500 mb-4">Referência visual para auxiliar na configuração de áreas de atuação.</p>
                    <div className="bg-white p-4 rounded-xl shadow-sm border overflow-hidden">
                        <img
                            src="/maps/Regionais_Curitiba.jpg"
                            alt="Mapa de Regionais de Curitiba"
                            className="w-full h-auto max-h-[800px] object-contain mx-auto"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function GeolocationConfig({ photographer, onUpdate }: { photographer: any, onUpdate: (id: string, data: any) => void }) {
    const [lat, setLat] = useState(photographer.latitude || '');
    const [lng, setLng] = useState(photographer.longitude || '');
    const [radius, setRadius] = useState(photographer.travelRadius || 15);
    const [color, setColor] = useState(photographer.color || '#3B82F6');
    const [baseAddress, setBaseAddress] = useState(photographer.baseAddress || '');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [addressSearch, setAddressSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

    // Reset state when photographer changes
    useEffect(() => {
        setLat(photographer.latitude || '');
        setLng(photographer.longitude || '');
        setRadius(photographer.travelRadius || 15);
        setColor(photographer.color || '#3B82F6');
        setBaseAddress(photographer.baseAddress || '');
        setAddressSearch('');
    }, [photographer.id]);

    const handleAddressInput = (value: string) => {
        setAddressSearch(value);
        setSuggestions([]);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        if (value.length > 3) {
            setIsSearchingSuggestions(true);
            searchTimeout.current = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/address/search?q=${encodeURIComponent(value)}`);
                    const data = await response.json();
                    setSuggestions(data.suggestions || []);
                } catch (error) {
                    console.error('Failed to fetch address suggestions:', error);
                } finally {
                    setIsSearchingSuggestions(false);
                }
            }, 400);
        }
    };

    const selectSuggestion = async (suggestion: string) => {
        setAddressSearch(suggestion);
        setSuggestions([]);
        setIsSearching(true);
        try {
            const response = await fetch('/api/address/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: suggestion }),
            });
            const data = await response.json();
            if (data.latitude && data.longitude) {
                setLat(data.latitude);
                setLng(data.longitude);
                setBaseAddress(suggestion);
            }
        } catch (error) {
            alert('Erro ao validar sugestão.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = async () => {
        if (!addressSearch) return;
        setIsSearching(true);
        try {
            // Reusing the existing validate endpoint which returns coordinates
            const response = await fetch('/api/address/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: addressSearch + ", Curitiba - PR" }), // Append context
            });
            const data = await response.json();

            if (data.latitude && data.longitude) {
                setLat(data.latitude);
                setLng(data.longitude);
                // Also set the base address to what was searched if successful
                setBaseAddress(addressSearch);
            } else {
                alert('Endereço não encontrado ou sem coordenadas.');
            }
        } catch (error) {
            alert('Erro ao buscar endereço.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const latNum = lat ? parseFloat(lat) : null;
        const lngNum = lng ? parseFloat(lng) : null;

        // Save multiple things: Location, Color, BaseAddress
        try {
            await Promise.all([
                updatePhotographerLocation(photographer.id, latNum, lngNum, radius),
                updatePhotographerColor(photographer.id, color),
                updatePhotographerBase(photographer.id, baseAddress, latNum, lngNum)
            ]);

            onUpdate(photographer.id, {
                latitude: latNum,
                longitude: lngNum,
                travelRadius: radius,
                color: color,
                baseAddress: baseAddress,
                baseLat: latNum,
                baseLng: lngNum
            });

            alert('Configurações atualizadas com sucesso!');
        } catch (error) {
            alert('Erro ao atualizar configurações.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 max-w-2xl">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{photographer.name}</h3>
                    <p className="text-sm text-slate-500">Configuração de logística e presença no mapa</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition disabled:opacity-50"
                >
                    {isSaving ? 'Salvando...' : 'Salvar Tudo'}
                </button>
            </div>

            {/* SEÇÃO 1: PONTO BASE (CASA DO FOTÓGRAFO) */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 leading-none">Ponto Base (Casa / Início)</h4>
                        <p className="text-[11px] text-slate-400 mt-1 uppercase font-black tracking-wider">Referência para o Pino Zero</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Buscador com Autocomplete */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Buscar Endereço</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={addressSearch}
                                    onChange={(e) => handleAddressInput(e.target.value)}
                                    placeholder="Comece a digitar o endereço comercial ou residencial..."
                                    className="w-full px-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
                                />
                                {isSearchingSuggestions && (
                                    <div className="absolute right-3 top-2.5">
                                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={isSearching}
                                className="bg-slate-800 text-white px-5 rounded-xl text-sm font-bold hover:bg-slate-900 transition disabled:opacity-50"
                            >
                                {isSearching ? '...' : 'Fixar'}
                            </button>
                        </div>

                        {/* Dropdown de Sugestões */}
                        {suggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => selectSuggestion(s)}
                                        className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 border-b last:border-0 transition-colors flex items-center gap-3"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                                        <span className="text-slate-700 font-medium">{s}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">Coordenadas Atuais</label>
                            <div className="flex items-center gap-2 font-mono text-sm text-slate-600 bg-white px-3 py-2 rounded-lg border">
                                <span className="opacity-40">LAT</span> {lat || '---'}
                                <span className="mx-1 opacity-20">|</span>
                                <span className="opacity-40">LNG</span> {lng || '---'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase mb-1">Visualização</label>
                            {lat && lng ? (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-bold bg-white px-4 py-2 rounded-lg border shadow-sm transition"
                                >
                                    Abrir Google Maps ↗
                                </a>
                            ) : (
                                <div className="text-slate-300 text-sm py-2 italic">Aguardando coordenadas...</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Endereço Confirmado (Base)</label>
                        <textarea
                            value={baseAddress}
                            onChange={(e) => setBaseAddress(e.target.value)}
                            readOnly
                            className="w-full px-4 py-3 text-sm border rounded-xl bg-slate-50 text-slate-500 italic"
                            rows={2}
                            placeholder="Selecione um endereço nas sugestões acima..."
                        />
                    </div>
                </div>
            </section>

            {/* SEÇÃO 2: ÁREA DE ATUAÇÃO E IDENTIFICAÇÃO */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-3 border-b flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m4.93 4.93 14.14 14.14" /></svg>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 leading-none">Área de Atuação (Geolocalização)</h4>
                        <p className="text-[11px] text-slate-400 mt-1 uppercase font-black tracking-wider">Raio e Identificação</p>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Cor de Identificação</label>
                            <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-16 h-12 p-1 rounded-lg border overflow-hidden cursor-pointer bg-white"
                                />
                                <input
                                    type="text"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="flex-1 px-4 py-2 text-sm border rounded-lg bg-white uppercase font-mono font-bold text-slate-700 shadow-inner"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 italic">* Cor usada nos pinos e rotas deste fotógrafo.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Raio de Atendimento (km)</label>
                            <div className="bg-slate-50 p-6 rounded-xl border">
                                <div className="flex items-center gap-4 mb-3">
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={radius}
                                        onChange={(e) => setRadius(parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="w-16 h-10 flex items-center justify-center bg-white border border-blue-200 rounded-lg shadow-sm font-black text-blue-700">
                                        {radius}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-tight">Agendamentos fora deste raio a partir da Base alertarão a secretaria.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

