import { Suspense } from 'react';
import DashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-screen bg-slate-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">Carregando Dashboard...</div>
                </div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
