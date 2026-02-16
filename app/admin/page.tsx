'use client';

import React, { useState, useEffect } from 'react';
import { getAdminData, updatePhotographerNeighborhoods, updatePhotographerServices, updatePhotographerLocation } from './actions';

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
                serviceNeighborhoods = serviceNeighborhoods.filter(n => n !== 'ALL');
            }

            if (serviceNeighborhoods.includes(neighborhood)) {
                serviceNeighborhoods = serviceNeighborhoods.filter(n => n !== neighborhood);
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
                                        {photographers.map(p => (
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
                                                                    {neighborhoods.sort().map(n => (
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
                                                onUpdate={(id, lat, lng, rad) => {
                                                    setPhotographers(prev => prev.map(p => p.id === id ? { ...p, latitude: lat, longitude: lng, travelRadius: rad } : p));
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

function GeolocationConfig({ photographer, onUpdate }: { photographer: any, onUpdate: (id: string, lat: number | null, lng: number | null, radius: number) => void }) {
    const [lat, setLat] = useState(photographer.latitude || '');
    const [lng, setLng] = useState(photographer.longitude || '');
    const [radius, setRadius] = useState(photographer.travelRadius || 15);
    const [addressSearch, setAddressSearch] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Reset state when photographer changes
    useEffect(() => {
        setLat(photographer.latitude || '');
        setLng(photographer.longitude || '');
        setRadius(photographer.travelRadius || 15);
        setAddressSearch('');
    }, [photographer.id]);

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

        const result = await updatePhotographerLocation(photographer.id, latNum, lngNum, radius);
        if (result.success) {
            onUpdate(photographer.id, latNum, lngNum, radius);
            alert('Localização atualizada com sucesso!');
        } else {
            alert('Erro ao atualizar: ' + result.error);
        }
        setIsSaving(false);
    };

    return (
        <div className="space-y-6 max-w-lg">
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">{photographer.name}</h3>
                <p className="text-sm text-slate-500">Configuração de Ponto Base e Raio de Atendimento</p>
            </div>

            {/* Address Search Helper */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-bold text-blue-900 mb-2">Preencher via Endereço</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={addressSearch}
                        onChange={(e) => setAddressSearch(e.target.value)}
                        placeholder="Ex: Rua XV de Novembro, 1000"
                        className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                    >
                        {isSearching ? '...' : 'Buscar'}
                    </button>
                </div>
                <p className="text-xs text-blue-600 mt-2">Busca automática no Google Maps (Curitiba).</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                    <input
                        type="number"
                        step="any"
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                    <input
                        type="number"
                        step="any"
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Raio de Atendimento (Km)</label>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={radius}
                        onChange={(e) => setRadius(parseInt(e.target.value))}
                        className="flex-1"
                    />
                    <div className="w-16 px-3 py-2 border rounded text-center bg-slate-50 font-bold text-slate-700">
                        {radius}
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">Distância máxima em linha reta (Haversine) que o fotógrafo atende a partir do ponto base.</p>
            </div>

            <div className="pt-4 border-t flex items-center justify-between">
                {lat && lng && (
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                        Ver no Mapa ↗
                    </a>
                )}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                    {isSaving ? 'Salvando...' : 'Salvar Configuração'}
                </button>
            </div>
        </div>
    );
}
