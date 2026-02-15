'use client';

import React, { useState, useEffect } from 'react';
import { getAdminData, updatePhotographerNeighborhoods, updatePhotographerServices } from './actions';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('skills');
    const [photographers, setPhotographers] = useState<any[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
    const [selectedPhotographerId, setSelectedPhotographerId] = useState<string | null>(null);
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
        // Special 'ALL' logic
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

    const handleNeighborhoodToggle = async (photographerId: string, neighborhood: string) => {
        const photographer = photographers.find(p => p.id === photographerId);
        if (!photographer) return;

        let newNeighborhoods = [...photographer.neighborhoods];

        if (neighborhood === 'ALL') {
            if (newNeighborhoods.includes('ALL')) {
                newNeighborhoods = [];
            } else {
                newNeighborhoods = ['ALL']; // If ALL is selected, maybe clear specific ones? Or keep them? Let's just use ALL as a token.
            }
        } else {
            // If 'ALL' was previously selected, remove it because we are now selecting specific
            if (newNeighborhoods.includes('ALL')) {
                newNeighborhoods = newNeighborhoods.filter(n => n !== 'ALL');
            }

            if (newNeighborhoods.includes(neighborhood)) {
                newNeighborhoods = newNeighborhoods.filter(n => n !== neighborhood);
            } else {
                newNeighborhoods.push(neighborhood);
            }
        }

        // Optimistic Update
        setPhotographers(prev => prev.map(p => p.id === photographerId ? { ...p, neighborhoods: newNeighborhoods } : p));

        await updatePhotographerNeighborhoods(photographerId, newNeighborhoods);
    };


    if (isLoading) return <div className="p-8 text-center text-slate-500">Carregando dados...</div>;

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Administração</h1>
                    <p className="text-slate-500">Gerenciamento de Habilidades e Regiões</p>
                </div>

                {/* Custom Tabs */}
                <div className="space-y-4">
                    <div className="flex space-x-1 rounded-xl bg-slate-200 p-1 w-fit">
                        {['skills', 'regions'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-32 rounded-lg py-2.5 text-sm font-medium leading-5 transition 
                  ${activeTab === tab
                                        ? 'bg-white text-blue-700 shadow'
                                        : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                                    }`}
                            >
                                {tab === 'skills' ? 'Habilidades' : 'Regiões'}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4">
                        {/* SKILLS TAB */}
                        {activeTab === 'skills' && (
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-6 border-b">
                                    <h3 className="text-xl font-semibold text-slate-800">Habilidades dos Fotógrafos</h3>
                                    <p className="text-sm text-slate-500 mt-1">Selecione serviços (Foto, Vídeo, Drone).</p>
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
                                <div className="flex gap-6">
                                    {/* Left: Photographer List */}
                                    <div className="w-1/3 border-r pr-6 space-y-2">
                                        <h3 className="font-semibold text-slate-700 mb-4">Selecione o Fotógrafo</h3>
                                        {photographers.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPhotographerId(p.id)}
                                                className={`w-full text-left px-4 py-3 rounded-lg border transition flex justify-between items-center ${selectedPhotographerId === p.id ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                            >
                                                {p.name}
                                                <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600">
                                                    {p.neighborhoods.includes('ALL') ? 'Toda Curitiba' : `${p.neighborhoods.length} bairros`}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Right: Neighborhood Configuration */}
                                    <div className="flex-1">
                                        {!selectedPhotographerId ? (
                                            <div className="h-full flex items-center justify-center text-slate-400 italic">
                                                Selecione um fotógrafo para editar a área de atuação.
                                            </div>
                                        ) : (
                                            <div>
                                                {(() => {
                                                    const p = photographers.find(x => x.id === selectedPhotographerId);
                                                    if (!p) return null;
                                                    return (
                                                        <>
                                                            <div className="flex justify-between items-center mb-4">
                                                                <h3 className="font-bold text-lg text-slate-800">Área de Atuação: {p.name}</h3>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="all_regions"
                                                                        checked={p.neighborhoods.includes('ALL')}
                                                                        onChange={() => handleNeighborhoodToggle(p.id, 'ALL')}
                                                                        className="w-5 h-5 accent-blue-600"
                                                                    />
                                                                    <label htmlFor="all_regions" className="text-sm font-medium text-slate-700">Atende Toda Curitiba (ALL)</label>
                                                                </div>
                                                            </div>

                                                            {!p.neighborhoods.includes('ALL') && (
                                                                <>
                                                                    <p className="text-sm text-slate-500 mb-4">Selecione os bairros específicos:</p>
                                                                    <div className="grid grid-cols-3 gap-2 h-[400px] overflow-y-auto pr-2 border rounded-lg p-4 bg-slate-50">
                                                                        {neighborhoods.sort().map(n => (
                                                                            <label key={n} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer transition">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={p.neighborhoods.includes(n)}
                                                                                    onChange={() => handleNeighborhoodToggle(p.id, n)}
                                                                                    className="w-4 h-4 accent-blue-600"
                                                                                />
                                                                                <span className="text-sm text-slate-700">{n}</span>
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                            {p.neighborhoods.includes('ALL') && (
                                                                <div className="p-8 bg-blue-50 text-blue-800 rounded-lg text-center border border-blue-100">
                                                                    Este fotógrafo está configurado para atender <strong>todos os bairros</strong> de Curitiba.
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
