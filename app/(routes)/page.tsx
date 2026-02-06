import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-4">Sistema de Agendamento</h1>
      <p className="text-lg text-gray-600 mb-8">Agende sua sessão de fotografia imobiliária de forma rápida e fácil.</p>
      <Link href="/agendar" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
        Fazer um Agendamento
      </Link>
    </div>
  );
}
