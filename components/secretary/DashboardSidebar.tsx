'use client';

import * as React from 'react';
import { Search, MapPin, Clock } from 'lucide-react';
import { Booking } from '@/lib/types/dashboard';

type DashboardSidebarProps = {
    activeTab: 'pending' | 'scheduled' | 'reserved' | 'waiting';
    onTabChange: (tab: 'pending' | 'scheduled' | 'reserved' | 'waiting') => void;
    pendingCount: number;
    scheduledCount: number;
    reservedCount: number;
    waitingCount: number;
    isLoading: boolean;
    items: Booking[];
    selectedOrder: Booking | null;
    onOrderClick: (order: Booking) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    globalSearch: boolean;
    onGlobalSearchChange: (val: boolean) => void;
    showUncompleted: boolean;
    onShowUncompletedChange: (val: boolean) => void;
    getMapColor: (name: string, currentColor: string | null) => string;
    getInitials: (name: string) => string;
    listMode?: 'day' | 'total';
    onListModeChange?: (mode: 'day' | 'total') => void;
    futureItems?: Booking[];
};

export function DashboardSidebar({
    activeTab,
    onTabChange,
    pendingCount,
    scheduledCount,
    reservedCount,
    waitingCount,
    isLoading,
    items,
    selectedOrder,
    onOrderClick,
    searchTerm,
    onSearchChange,
    globalSearch,
    onGlobalSearchChange,
    showUncompleted,
    onShowUncompletedChange,
    getMapColor,
    getInitials,
    listMode,
    onListModeChange,
    futureItems = []
}: DashboardSidebarProps) {
    // Auto-scroll to selected item
    React.useEffect(() => {
        if (selectedOrder) {
            const el = document.getElementById(`order-card-${selectedOrder.id}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [selectedOrder]);

    const [serviceFilter, setServiceFilter] = React.useState<string | 'all'>('all');

    const uniqueServices = React.useMemo(() => {
        const svcs = new Set<string>();
        items.forEach(i => i.services?.forEach(s => svcs.add(s)));
        return Array.from(svcs).sort();
    }, [items]);

    return (
        <div className="w-[340px] bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/50 flex flex-col shrink-0 z-30 shadow-xl overflow-hidden transition-colors">
            {/* Filter / Search Area */}
            <div className="p-3 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/50 flex flex-col gap-3 transition-colors">
                <div className="relative">
                    <input
                        type="text"
                        placeholder={globalSearch ? "Pesquisa global em todas abas..." : "Buscar por nome, ref ou endereço..."}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow bg-slate-50 focus:bg-white font-medium"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <div className="flex flex-col gap-2 px-1">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                            checked={globalSearch}
                            onChange={(e) => onGlobalSearchChange(e.target.checked)}
                        />
                        <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors tracking-tight">Pesquisar em todas as abas</span>
                    </label>

                    {activeTab === 'scheduled' && (
                        <div className="flex flex-col gap-2">
                            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                <button
                                    onClick={() => onListModeChange && onListModeChange('day')}
                                    className={`flex-1 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${listMode === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    VISÃO DIA
                                </button>
                                <button
                                    onClick={() => onListModeChange && onListModeChange('total')}
                                    className={`flex-1 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${listMode === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                                >
                                    VISÃO TOTAL
                                </button>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer group px-1">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 transition-all cursor-pointer"
                                    checked={showUncompleted}
                                    onChange={(e) => onShowUncompletedChange(e.target.checked)}
                                />
                                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors tracking-tight">Ver agendados não realizados</span>
                            </label>
                        </div>
                    )}

                    {uniqueServices.length > 0 && (
                        <div className="mt-1">
                            <select
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] uppercase font-bold text-slate-600 focus:outline-none focus:border-orange-500 cursor-pointer transition-colors shadow-sm"
                                value={serviceFilter}
                                onChange={e => setServiceFilter(e.target.value)}
                            >
                                <option value="all">Filtro: Todos os Serviços</option>
                                <option value="especial">Filtro: Ocultar quem é só 'Fotos'</option>
                                {uniqueServices.map(s => <option key={s} value={s}>Somente: {s}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 dark:bg-slate-950/50 transition-colors">
                {isLoading && <p className="text-center text-slate-400 py-4">Carregando...</p>}

                {!isLoading && (() => {
                    const displayItems = (activeTab === 'scheduled' && listMode === 'total') ? futureItems : items;
                    console.log(`[Sidebar] activeTab=${activeTab} items=${items.length} displayItems=${displayItems.length}`);

                    const filtered = displayItems.filter(order => {
                        const term = searchTerm.toLowerCase();
                        const textMatch = !searchTerm || (
                            order.clientName.toLowerCase().includes(term) ||
                            (order.protocol && order.protocol.toLowerCase().includes(term)) ||
                            order.id.toLowerCase().includes(term) ||
                            (order.neighborhood && order.neighborhood.toLowerCase().includes(term)) ||
                            (order.address && order.address.toLowerCase().includes(term))
                        );

                        // Service Filter
                        let serviceMatch = true;
                        if (serviceFilter !== 'all') {
                            const upperServices = (order.services || []).map(s => s.toUpperCase());
                            if (serviceFilter === 'especial') {
                                // Pede "Excluir quem é só Fotos" -> Passa quem tiver qualquer serviço que NÃO seja Foto
                                serviceMatch = upperServices.some(s => !s.includes('FOTO') && !s.includes('FOTOGRAFIA') && s.trim() !== '');
                            } else {
                                serviceMatch = (order.services || []).includes(serviceFilter);
                            }
                        }

                        return textMatch && serviceMatch;
                    });

                    if (filtered.length === 0) {
                        return (
                            <div className="text-center py-10 text-slate-300">
                                <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Search className="w-6 h-6 opacity-20" />
                                </div>
                                <p className="text-xs font-bold tracking-widest">Nenhum item encontrado</p>
                            </div>
                        );
                    }

                    return filtered.map(order => {
                        const isSelected = selectedOrder?.id === order.id;
                        const isConfirmed = order.status === 'CONFIRMED';
                        const isReserved = order.status === 'RESERVED' || order.status === 'RESERVADO';
                        const isCompleted = order.status === 'REALIZADO' || order.status === 'COMPLETED';
                        const isActuallyPending = !order.photographerId || order.status === 'PENDING' || order.status === 'PENDENTE';

                        return (
                            <div
                                key={order.id}
                                id={`order-card-${order.id}`}
                                onClick={() => onOrderClick(order)}
                                className={`
                                flex flex-col gap-1 p-3 rounded-lg border shadow-sm cursor-pointer transition-all relative group
                                ${isSelected
                                        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-500 ring-1 ring-orange-200 dark:ring-orange-800/50 shadow-md'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-600/50 hover:shadow-md'
                                    }
                            `}
                            >
                                {/* Linha 1: Ref & Status Badge */}
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                        #{order.protocol || order.id.substring(0, 6)}
                                    </span>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isConfirmed ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40' :
                                        isReserved ? 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40' :
                                            isCompleted ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40' :
                                                'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40'
                                        }`}>
                                        {order.status === 'PENDING' ? 'Pendente' : (order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()) : (isActuallyPending ? 'Pendente' : 'Agendado'))}
                                    </span>
                                </div>

                                {/* Linha 2: BAIRRO (e Cidade se não for Curitiba) */}
                                <div className="mt-1">
                                    <h3 className={`font-black text-xs uppercase tracking-tight ${isSelected ? 'text-orange-900 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                                        {order.neighborhood}
                                        {order.city && order.city.toLowerCase() !== 'curitiba' && (
                                            <span className="ml-1 text-[10px] opacity-60 font-medium">({order.city})</span>
                                        )}
                                    </h3>
                                </div>

                                {/* Linha 3: Endereço completo */}
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight flex items-start gap-1">
                                    <MapPin className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                                    <span className="truncate">{order.address}</span>
                                </div>

                                {/* Linha 4: Tipo de Imóvel */}
                                {order.propertyType && (
                                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded w-fit">
                                        {order.propertyType}
                                    </div>
                                )}

                                {/* Linha 5: Nome do Cliente */}
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                    <span className="truncate">{order.clientName}</span>
                                </div>

                                {/* Linha 6: Tags de Serviços */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {order.services.slice(0, 5).map(s => (
                                        <span key={s} className="text-[8px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                                            {s}
                                        </span>
                                    ))}
                                    {order.services.length > 5 && (
                                        <span className="text-[8px] text-slate-400">+{order.services.length - 5}</span>
                                    )}
                                </div>

                                {/* Agendamento Info (if scheduled) */}
                                {order.photographer && (
                                    <div className="flex items-center gap-2 mt-2 px-1 py-1 bg-blue-50/50 dark:bg-blue-900/20 rounded border border-blue-100/50 dark:border-blue-800/50 border-dashed">
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm" style={{ backgroundColor: getMapColor(order.photographer.name, order.photographer.color || '#3B82F6') }}>
                                            {getInitials(order.photographer.name)}
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">{order.photographer.name}</span>
                                        <span className="text-[10px] text-blue-500 dark:text-blue-500 ml-auto flex items-center gap-0.5">
                                            <Clock className="w-2.5 h-2.5" />
                                            {order.time}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    });
                })()}
            </div>
        </div>
    );
}

