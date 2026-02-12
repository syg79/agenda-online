import { Suspense } from 'react';
import BookingForm from '@/components/booking-form';

export default function AgendarPage() {
  return (
    <main>
      <Suspense fallback={<div className="p-8 text-center">Carregando formulário...</div>}>
        <BookingForm companyName="Sua Empresa de Fotografia" />
      </Suspense>
    </main>
  );
}
