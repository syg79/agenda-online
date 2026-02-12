'use client';

import React, { useState } from 'react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('skills');

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Administração</h1>
                    <p className="text-slate-500">Gerenciamento de Habilidades, Regiões e Preferências</p>
                </div>

                {/* Custom Tabs */}
                <div className="space-y-4">
                    <div className="flex space-x-1 rounded-xl bg-slate-200 p-1 w-fit">
                        {['skills', 'regions', 'clients'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`w-32 rounded-lg py-2.5 text-sm font-medium leading-5 transition 
                  ${activeTab === tab
                                        ? 'bg-white text-blue-700 shadow'
                                        : 'text-slate-600 hover:bg-white/[0.12] hover:text-slate-800'
                                    }`}
                            >
                                {tab === 'skills' ? 'Habilidades' : tab === 'regions' ? 'Regiões' : 'Clientes'}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4">
                        {/* SKILLS TAB */}
                        {activeTab === 'skills' && (
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-6 border-b">
                                    <h3 className="text-xl font-semibold text-slate-800">Habilidades dos Fotógrafos</h3>
                                    <p className="text-sm text-slate-500 mt-1">Selecione quais serviços cada fotógrafo pode realizar.</p>
                                </div>
                                <div className="p-6">
                                    <div className="border rounded-lg divide-y">
                                        <div className="p-4 bg-slate-50 font-medium grid grid-cols-4 gap-4 text-sm text-slate-600">
                                            <div>Fotógrafo</div>
                                            <div className="text-center">Foto</div>
                                            <div className="text-center">Vídeo</div>
                                            <div className="text-center">Drone</div>
                                        </div>
                                        {/* Mocks */}
                                        {['Rafael', 'Augusto', 'Renato', 'Rodrigo'].map((name) => (
                                            <div key={name} className="p-4 grid grid-cols-4 gap-4 items-center">
                                                <div className="font-medium text-slate-800">{name}</div>
                                                <div className="flex justify-center"><input type="checkbox" defaultChecked={true} className="w-5 h-5 text-blue-600 rounded" /></div>
                                                <div className="flex justify-center"><input type="checkbox" defaultChecked={name !== 'Renato' && name !== 'Rodrigo'} className="w-5 h-5 text-blue-600 rounded" /></div>
                                                <div className="flex justify-center"><input type="checkbox" defaultChecked={name === 'Rafael'} className="w-5 h-5 text-blue-600 rounded" /></div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
                                            Salvar Alterações
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* REGIONS TAB */}
                        {activeTab === 'regions' && (
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-6 border-b flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-800">Regiões de Atendimento</h3>
                                    </div>
                                    <button className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-2 px-4 rounded-lg text-sm">
                                        + Nova Região
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {/* Mock Regions */}
                                        <div className="border rounded-lg p-4 bg-white hover:border-blue-300 transition">
                                            <div className="flex justify-between mb-2">
                                                <h3 className="font-bold text-lg text-slate-800">Curitiba - Central</h3>
                                                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5 rounded">4 Fotógrafos</span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-4">Bairros: Centro, Batel, Água Verde...</p>
                                            <div className="flex gap-2">
                                                <button className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded">Editar</button>
                                                <button className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded">Excluir</button>
                                            </div>
                                        </div>
                                        <div className="border rounded-lg p-4 bg-white hover:border-blue-300 transition">
                                            <div className="flex justify-between mb-2">
                                                <h3 className="font-bold text-lg text-slate-800">Curitiba - Sul</h3>
                                                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5 rounded">2 Fotógrafos</span>
                                            </div>
                                            <p className="text-sm text-slate-600 mb-4">Bairros: Sítio Cercado, Tatuquara...</p>
                                            <div className="flex gap-2">
                                                <button className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded">Editar</button>
                                                <button className="text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded">Excluir</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CLIENTS TAB */}
                        {activeTab === 'clients' && (
                            <div className="bg-white rounded-lg border shadow-sm">
                                <div className="p-6 border-b">
                                    <h3 className="text-xl font-semibold text-slate-800">Preferências de Clientes</h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex gap-4 mb-6">
                                        <input
                                            type="text"
                                            placeholder="Buscar cliente por email ou nome..."
                                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg">
                                            Buscar
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-lg text-slate-800">Imobiliária J8</h3>
                                                    <p className="text-slate-500 text-sm">j8@cliente.com</p>
                                                </div>
                                                <button className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-1.5 px-3 rounded-lg text-xs">
                                                    Adicionar Preferência
                                                </button>
                                            </div>

                                            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ordem de Prioridade</p>
                                                <div className="flex items-center gap-3 bg-white p-3 rounded border shadow-sm">
                                                    <span className="bg-blue-100 text-blue-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">1</span>
                                                    <span className="font-medium text-slate-800">Renato</span>
                                                    <span className="text-xs text-slate-400 ml-auto flex gap-2">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold">Foto</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white p-3 rounded border shadow-sm">
                                                    <span className="bg-slate-100 text-slate-700 w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold">2</span>
                                                    <span className="font-medium text-slate-800">Augusto</span>
                                                    <span className="text-xs text-slate-400 ml-auto flex gap-2">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold">Foto</span>
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold">Vídeo</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
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
