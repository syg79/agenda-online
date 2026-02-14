'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Camera, Video, Plane, Check, ChevronRight, ChevronLeft, AlertCircle, Phone, Calendar, Mail } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { formatPhone, isValidEmail } from '@/lib/utils';

// Definições de tipos
type Service = {
  id: string;
  name: string;
  duration: number;
  icon: React.ElementType;
  description: string;
  price: number;
};

interface BookingFormProps {
  companyName: string;
}

function BookingForm({ companyName }: BookingFormProps) {
  const searchParams = useSearchParams();
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showPrices, setShowPrices] = useState(false); // Controle facultativo de preços

  const services: Service[] = [
    { id: 'photo', name: 'Fotos', duration: 40, icon: Camera, description: 'Sessão fotográfica completa', price: 250 },
    { id: 'video_landscape', name: 'Vídeo Paisagem', duration: 50, icon: Video, description: 'Vídeo horizontal (YouTube)', price: 300 },
    { id: 'video_portrait', name: 'Vídeo Retrato', duration: 50, icon: Video, description: 'Vídeo vertical (Reels/Shorts)', price: 300 },
    { id: 'drone_photo', name: 'Drone - Fotos', duration: 25, icon: Plane, description: 'Imagens aéreas', price: 200 },

    { id: 'drone_photo_video', name: 'Drone - Fotos + Vídeo', duration: 40, icon: Plane, description: 'Imagens e vídeo aéreos', price: 350 },
    { id: 'tour_360', name: 'Tour 360º', duration: 60, icon: Video, description: 'Imersão virtual completa', price: 400 }
  ];

  const [step, setStep] = useState(1);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');

  // URL Params Pre-fill (State)
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [complement, setComplement] = useState('');
  const [notes, setNotes] = useState('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync state with URL params when they change
  useEffect(() => {
    const pProtocol = searchParams.get('protocol');

    if (pProtocol) {
      // Situation 2: Fetch data from Tadabase
      const fetchBooking = async () => {
        try {
          // Show some loading state if needed, or just fill
          setIsSearching(true);
          const res = await fetch(`/api/tadabase/booking?protocol=${pProtocol}`);
          if (res.ok) {
            const data = await res.json();

            // Fill Fields
            if (data.clientName) setClientName(data.clientName);
            if (data.clientEmail) setClientEmail(data.clientEmail);
            if (data.clientPhone) setClientPhone(data.clientPhone);

            if (data.address) {
              setAddress(data.address);
              // Validate address implicit check? or just set it.
              // If we have address/neighborhood, we can assume it's valid or let user check.
            }
            if (data.neighborhood) setNeighborhood(data.neighborhood);
            if (data.zipCode) setZipCode(data.zipCode);
            if (data.complement) setComplement(data.complement);
            if (data.notes) setNotes(data.notes);

            if (data.services && Array.isArray(data.services)) {
              setSelectedServices(data.services);
            }

            // Pre-fill Date & Time if available
            if (data.date) {
              const [y, m, d] = data.date.split('-').map(Number);
              const pDate = new Date(y, m - 1, d);
              setSelectedDate(pDate);

              if (data.services && Array.isArray(data.services)) {
                // Fetch availability immediately with the known services
                fetchAvailability(pDate, data.services);
              }

              if (data.time) {
                setSelectedTime(data.time);
              }
            }

            // Navigation Logic based on data completeness
            // User requested to start at Step 1 (Address) to review data
            if (data) {
              setStep(1);
            } else if (data.address && data.services && data.services.length > 0 && data.date && data.time) {
              // setStep(5); // Disabled per user request
            } else if (data.address && data.services && data.services.length > 0) {
              // setStep(3); // Disabled per user request
            } else if (data.address) {
              // setStep(2); // Disabled per user request
            }

          }
        } catch (error) {
          console.error('Error fetching protocol data:', error);
        } finally {
          setIsSearching(false);
        }
      };

      fetchBooking();
    } else {
      // Legacy/Standard Params
      const pName = searchParams.get('nome');
      const pEmail = searchParams.get('email');
      const pPhone = searchParams.get('telefone');
      const pAddress = searchParams.get('endereco');
      const pNeighborhood = searchParams.get('bairro');
      const pZip = searchParams.get('cep');
      const pComplement = searchParams.get('complemento');
      const pRef = searchParams.get('ref');

      if (pName) setClientName(pName);
      if (pEmail) setClientEmail(pEmail);
      if (pPhone) setClientPhone(pPhone);
      if (pAddress) setAddress(pAddress);
      if (pNeighborhood) setNeighborhood(pNeighborhood);
      if (pZip) setZipCode(pZip);
      if (pComplement) setComplement(pComplement);
      if (pRef) setNotes(curr => curr.includes('Ref:') ? curr : (curr ? `${curr}\nRef: ${pRef}` : `Ref: ${pRef}`));
    }
  }, [searchParams]);

  const [error, setError] = useState('');
  const [protocol, setProtocol] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [timeSlots, setTimeSlots] = useState<{ time: string, endTime: string, available: number }[]>([]);
  const [isOutOfCoverage, setIsOutOfCoverage] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = React.useRef<NodeJS.Timeout | null>(null);

  const handleAddressInput = (value: string) => {
    setAddress(value);
    setIsOutOfCoverage(false); // Reset
    setSuggestions([]);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (value.length > 2) {
      setIsSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const response = await fetch(`/api/address/search?q=${encodeURIComponent(value)}`);
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        } catch (error) {
          console.error('Failed to fetch address suggestions:', error);
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }, 300); // 300ms debounce
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setAddress(suggestion);
    setSuggestions([]);
    setIsOutOfCoverage(false); // Reset coverage check on new selection
  };

  const [isValidating, setIsValidating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const validateAddress = async () => {
    // Explicitly reset coverage error (fixes false positives)
    setIsOutOfCoverage(false);

    setIsValidating(true);
    setError('');
    try {
      const response = await fetch('/api/address/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao validar o endereço.');
        return false;
      }

      if (!data.inCoverage) {
        if (data.city) {
          setError(`A cidade de ${data.city} ainda não é atendida. Entre em contato para verificar a disponibilidade.`);
        } else {
          setError('Endereço fora da área de cobertura. Verifique ou entre em contato.');
        }
        return false;
      }

      if (data.neighborhood !== neighborhood) {
        // Neighborhood changed, invalidating potential photographer availability
        setTimeSlots([]);
        setSelectedTime('');
        // We don't clear date, but we force re-fetch if they go to that step
      }
      setNeighborhood(data.neighborhood);
      setZipCode(data.zipCode || '');
      setError('');
      return true;
    } catch (err) {
      setError('Falha na comunicação com o servidor. Tente novamente.');
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const toggleService = (serviceId: string) => {
    let newServices = [...selectedServices];

    if (newServices.includes(serviceId)) {
      // Service is already selected, so remove it
      newServices = newServices.filter(id => id !== serviceId);
    } else {
      // Service is not selected, so add it
      newServices.push(serviceId);

      // Mutual Exclusivity Logic for Drone services
      if (serviceId === 'drone_photo_video') {
        // If Combo selected, remove standalone Drone Photo and Drone Video
        if (newServices.includes('drone_photo') || newServices.includes('drone_video')) {
          showToast("O combo 'Drone - Fotos + Vídeo' já inclui fotos e vídeos aéreos. As opções avulsas foram desmarcadas.");
          newServices = newServices.filter(id => id !== 'drone_photo' && id !== 'drone_video');
        }
      } else if (serviceId === 'drone_photo' || serviceId === 'drone_video') {
        // If standalone Drone Photo or Drone Video selected, remove Combo
        if (newServices.includes('drone_photo_video')) {
          showToast("Ao selecionar um serviço de Drone avulso, o combo 'Drone - Fotos + Vídeo' foi desmarcado.");
          newServices = newServices.filter(id => id !== 'drone_photo_video');
        }
      }
    }

    setSelectedServices(newServices);

    // UX Fix: Do NOT reset date/time when changing services, unless necessary.
    if (selectedDate) {
      // Re-fetch availability to update slots based on new duration
      fetchAvailability(selectedDate, newServices);
    }
    // Only clear specific time slot as duration change might invalidate it
    setSelectedTime('');
  };

  const getTotalDuration = () => {
    let total = 0;
    for (let i = 0; i < selectedServices.length; i++) {
      const service = services.find(s => s.id === selectedServices[i]);
      if (service) total += service.duration;
    }
    return total;
  };

  const getTotalPrice = () => {
    let total = 0;
    for (let i = 0; i < selectedServices.length; i++) {
      const service = services.find(s => s.id === selectedServices[i]);
      if (service) total += service.price;
    }
    return total;
  };

  const fetchAvailability = async (date: Date, servicesOverride?: string[]) => {
    const servicesToUse = servicesOverride || selectedServices;
    if (!date || servicesToUse.length === 0) return;

    setIsLoadingSlots(true);
    setTimeSlots([]);
    setError('');

    // Format date to YYYY-MM-DD
    const dateString = date.toISOString().split('T')[0];
    const servicesString = servicesToUse.join(',');

    try {
      const response = await fetch(`/api/availability?date=${dateString}&services=${servicesString}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar horários.');
      }

      setTimeSlots(data.slots || []);
      if (data.slots.length === 0) {
        setError('Nenhum horário disponível para esta data e serviços.');
      }

    } catch (err: any) {
      setError(err.message || 'Falha ao buscar horários. Tente outra data.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    // If clicking the same date, deselect it
    if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
      setSelectedDate(null);
      setSelectedTime('');
      setTimeSlots([]);
      return;
    }

    setSelectedDate(date);
    setSelectedTime('');
    fetchAvailability(date);
  };

  const generateCalendar = () => {
    const today = new Date();
    const calendar: any[] = [];

    // Start calendar from the first day of the current month for alignment
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();

    // Add empty cells for days before the 1st of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push({ type: 'empty' });
    }

    // Generate days for the next ~5 weeks
    for (let i = 1; i <= 35; i++) {
      const date = new Date(firstDayOfMonth);
      date.setDate(firstDayOfMonth.getDate() + i - 1);

      const dayOfWeek = date.getDay();
      const isSunday = dayOfWeek === 0;
      const isPast = date < today && date.toDateString() !== today.toDateString();

      calendar.push({
        type: 'day',
        date: date,
        day: date.getDate(),
        month: date.getMonth(),
        weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        available: !isSunday && !isPast,
        isSunday: isSunday
      });
    }

    const weeks = [];
    for (let i = 0; i < calendar.length; i += 7) {
      const weekDays = calendar.slice(i, i + 7);
      // Pega o mês do primeiro dia da semana para o título
      const firstDayOfWeek = weekDays.find(d => d.type === 'day') || weekDays[0];
      const monthName = firstDayOfWeek.date ? firstDayOfWeek.date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '';

      weeks.push({
        days: weekDays,
        monthName: monthName
      });
    }

    return weeks.filter(week => week.days.some(d => d.type === 'day' && (d.month === today.getMonth() || d.month === (today.getMonth() + 1) % 12)));
  };

  const goNext = async () => {
    if (step === 1) {
      if (!address.trim()) {
        setError('Por favor, insira o endereço completo');
        return;
      }
      const isValid = await validateAddress();
      if (!isValid) return;
    }
    if (step === 2 && selectedServices.length === 0) {
      setError('Selecione pelo menos um serviço');
      return;
    }
    if (step === 3 && !selectedDate) {
      setError('Selecione uma data');
      return;
    }
    if (step === 4 && !selectedTime) {
      setError('Selecione um horário');
      return;
    }
    if (step === 5) {
      if (!clientName || !clientEmail || !clientPhone) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }
      if (!isValidEmail(clientEmail)) {
        setError('Por favor, insira um email válido');
        return;
      }
      if (clientPhone.replace(/\D/g, '').length < 10) {
        setError('Por favor, insira um telefone válido com DDD');
        return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const confirm = async () => {
    setIsConfirming(true);
    setError('');

    try {
      const bookingData = {
        clientName,
        clientEmail,
        clientPhone,
        notes,
        address,
        complement,
        neighborhood,
        zipCode,
        selectedServices,
        selectedDate,
        selectedTime,
        totalDuration: getTotalDuration(),
        totalPrice: getTotalPrice(),
        sourceProtocol: searchParams.get('protocol'), // Send original protocol if editing
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao confirmar o agendamento.');
      }

      setProtocol(data.protocol);
      setStep(7);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsConfirming(false);
    }
  };

  const reset = () => {
    setStep(1);
    setAddress('');
    setComplement('');
    setNeighborhood('');
    setZipCode('');
    setSelectedServices([]);
    setSelectedDate(null);
    setSelectedTime('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setNotes('');
    setError('');
    setProtocol('');
  };

  const getServiceNames = () => {
    // Fixed Order for display
    const order = ['photo', 'video_landscape', 'video_portrait', 'drone_photo', 'drone_photo_video', 'tour_360'];

    // Sort selected services based on index in 'order' array
    const sorted = [...selectedServices].sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    return sorted.map(id => {
      const service = services.find(s => s.id === id);
      return service ? service.name : '';
    }).filter(Boolean).join(' + ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">{companyName}</h1>
              <p className="text-sm text-slate-500">Fotografia Imobiliária Profissional</p>
            </div>
          </div>
        </div>
      </div>

      {step < 7 && (
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {/* Desktop/Tablet Stepper */}
            <div className="hidden md:flex items-center justify-between relative">
              {/* Progress Bar Background */}
              <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-200 -z-10"></div>
              {/* Active Progress Bar */}
              <div
                className="absolute top-4 left-0 h-0.5 bg-green-500 -z-10 transition-all duration-300"
                style={{ width: `${((step - 1) / 5) * 100}%` }}
              ></div>

              {[1, 2, 3, 4, 5, 6].map((s) => {
                let label = '';
                if (s === 1) label = 'Endereço';
                if (s === 2) label = 'Serviços';
                if (s === 3) label = 'Data';
                if (s === 4) label = 'Horário';
                if (s === 5) label = 'Dados';
                if (s === 6) label = 'Confirma';

                // Navigation Logic
                const canNavigate = () => {
                  if (s === 1) return true;
                  if (s === 2) return !!address;
                  if (s === 3) return !!address && selectedServices.length > 0;
                  if (s === 4) return !!address && selectedServices.length > 0 && !!selectedDate;
                  if (s === 5) return !!address && selectedServices.length > 0 && !!selectedDate && !!selectedTime;
                  return false;
                };

                const isClickable = s < step || canNavigate();

                return (
                  <button
                    key={s}
                    onClick={() => isClickable && setStep(s)}
                    disabled={!isClickable}
                    className="flex flex-col items-center flex-1 z-10 focus:outline-none group"
                  >
                    <div
                      className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ' +
                        (s < step ? 'bg-green-500 text-white' : s === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300')
                      }
                    >
                      {s < step ? <Check className="w-4 h-4" /> : s}
                    </div>
                    <span className={`text-[10px] mt-1 font-medium uppercase tracking-wide transition-colors ${s === step ? 'text-blue-600' : s < step ? 'text-green-600' : 'text-slate-400'}`}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Mobile Stepper (Simplified) */}
            <div className="md:hidden flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Etapa {step} de 6</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map(s => (
                  <div key={s} className={`h-1.5 w-6 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                ))}
              </div>
            </div>
          </div>

          {/* Persistent Address Info Bar (Step > 1) */}
          {/* Persistent Address Info Bar (Step > 1) */}
          {step > 1 && address && (
            <div className="bg-slate-50 border-t px-4 py-2 text-sm text-slate-600 border-b flex justify-center">
              <div className="max-w-4xl w-full flex flex-col gap-1">

                {/* Line 1: Address + Change Button */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-800 shrink-0">Local:</span>
                    <span className="truncate">{address} {complement ? `- ${complement}` : ''}</span>
                  </div>
                  <button onClick={() => setStep(1)} className="text-blue-600 hover:underline text-xs shrink-0 font-medium whitespace-nowrap">Alterar</button>
                </div>

                {/* Line 2: Date/Time (If selected) */}
                {selectedDate && step > 3 && (
                  <div className="flex items-center gap-2 truncate border-t border-slate-200 pt-1 mt-1">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-medium text-slate-800 shrink-0">Data:</span>
                    <span className="truncate">
                      {selectedDate.toLocaleDateString('pt-BR')} {selectedTime ? `- ${selectedTime}` : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Custom Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-2 text-sm max-w-sm text-center">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
          {toastMessage}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Onde será a sessão?</h2>
                <p className="text-slate-600">Informe o endereço completo</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Endereço Completo *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => handleAddressInput(e.target.value)}
                    placeholder="Digite o endereço..."
                    className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors ${isOutOfCoverage ? 'border-yellow-400 bg-yellow-50/50' : 'border-slate-300'}`}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-3.5">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {suggestions.length > 0 && !isSearching && (
                  <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSuggestion(sug)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0 text-sm flex items-center"
                      >
                        <MapPin className="inline w-4 h-4 mr-2 text-slate-400 shrink-0" />
                        <span className="truncate">{sug}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coverage Alert - Non-intrusive */}
              {(isOutOfCoverage || (error && error.toLowerCase().includes('não é atendida'))) && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-lg animate-in slide-in-from-top-2 duration-300 mt-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-yellow-100 p-2 rounded-full shrink-0">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-yellow-900 mb-1 text-base">
                        {isOutOfCoverage ? 'Endereço fora da área de cobertura' : 'Cidade não atendida via sistema'}
                      </h3>
                      <p className="text-sm text-yellow-800 mb-4 leading-relaxed">
                        {isOutOfCoverage
                          ? 'A cidade de São Paulo ainda não está disponível pela versão automatizada.'
                          : error
                        }
                        <br />Por favor, entre em contato para verificar a disponibilidade.
                      </p>
                      <a
                        href="https://wa.me/5541999999999"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-3 px-5 rounded-lg transition-all hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Chamar no WhatsApp: (41) 99999-9999</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Complemento</label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  placeholder="Apto 101, Bloco B..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* General Errors (Network, Validation, Empty fields) */}
              {error && !error.toLowerCase().includes('não é atendida') && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button onClick={goNext} disabled={isValidating || isOutOfCoverage} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors">
                {isValidating ? 'Validando endereço...' : 'Continuar'} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Quais serviços?</h2>
                <p className="text-slate-600">Selecione um ou mais</p>
              </div>
              <div className="space-y-3">
                {services.map((service) => {
                  const Icon = service.icon;
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={'w-full p-4 border-2 rounded-lg text-left transition ' + (isSelected ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300')}
                    >
                      <div className="flex items-start gap-4">
                        <div className={'p-3 rounded-lg ' + (isSelected ? 'bg-blue-600' : 'bg-slate-100')}>
                          <Icon className={'w-6 h-6 ' + (isSelected ? 'text-white' : 'text-slate-600')} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-1">{service.name}</h3>
                          <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{service.duration} min
                          </span>
                          {showPrices && (
                            <div className="text-sm font-semibold text-blue-600 mt-1">R$ {service.price},00</div>
                          )}
                        </div>
                        <div className={'w-6 h-6 rounded border-2 flex items-center justify-center ' + (isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300')}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedServices.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-900 mb-2">Resumo</h3>
                  <p className="text-sm text-green-800">Serviços: {getServiceNames()}</p>
                  <p className="text-sm text-green-800">Duração: {getTotalDuration()} min</p>
                  {showPrices && (
                    <p className="text-lg font-bold text-green-900 mt-2">Total: R$ {getTotalPrice()},00</p>
                  )}
                </div>
              )}
              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  <ChevronLeft className="w-5 h-5" />Voltar
                </button>
                <button onClick={goNext} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  Continuar <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Qual o melhor dia?</h2>
                <p className="text-slate-600">Selecione a data</p>
              </div>

              <div className="space-y-6">
                {generateCalendar().map((week, weekIdx) => (
                  <div key={weekIdx}>
                    {weekIdx === 0 && (
                      <div className="mb-3">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase">{week.monthName}</h3>
                      </div>
                    )}
                    {weekIdx > 0 && week.monthName !== generateCalendar()[weekIdx - 1].monthName && (
                      <div className="pt-4 pb-3 border-t-2 border-slate-200 mt-6">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase">{week.monthName}</h3>
                      </div>
                    )}
                    <div className="grid grid-cols-7 gap-2">
                      {weekIdx === 0 && (
                        <React.Fragment>
                          <div className="text-center text-xs font-medium text-slate-500 pb-2">Dom</div>
                          <div className="text-center text-xs font-medium text-slate-500 pb-2">Seg</div>
                          <div className="text-center text-xs font-medium text-slate-500 pb-2">Ter</div>
                          <div className="text-center text-xs font-medium text-slate-500 pb-2">Qua</div>
                          <div className="text-center text-xs font-medium text-slate-500 pb-2">Qui</div>
                          <div className="text-center text-xs font-medium text-slate-500 pb-2">Sex</div>
                          <div className="text-center text-xs font-medium text-slate-500 pb-2">Sáb</div>
                        </React.Fragment>
                      )}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {week.days.map((item: any, dayIdx: number) => {
                        if (item.type === 'empty') {
                          return <div key={'empty' + dayIdx} className="p-3"></div>;
                        }
                        const day = item;
                        const isSelected = selectedDate && selectedDate.getDate() === day.day && selectedDate.getMonth() === day.month;
                        return (
                          <button
                            key={'day' + weekIdx + dayIdx}
                            onClick={() => day.available && handleDateSelect(day.date)}
                            disabled={!day.available}
                            className={'p-3 rounded-lg border-2 transition text-center ' + (isSelected ? 'border-blue-600 bg-blue-50' : day.available ? 'border-slate-200 hover:border-blue-300' : 'border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed')}
                          >
                            <div className="text-xs text-slate-500 mb-1">{day.weekday}</div>
                            <div className={'text-lg font-semibold ' + (isSelected ? 'text-blue-600' : day.available ? 'text-slate-800' : 'text-slate-400')}>{day.day}</div>
                            {day.isSunday && <div className="text-xs text-red-500 mt-1">-</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  <ChevronLeft className="w-5 h-5" />Voltar
                </button>
                <button onClick={goNext} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  Continuar <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && selectedDate && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Qual horário?</h2>
                <p className="text-slate-600">Horários para {selectedDate.toLocaleDateString('pt-BR')}</p>
                <p className="text-sm text-slate-500">Duração: {getTotalDuration()} min</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {isLoadingSlots && <p className="text-slate-500 col-span-full">Buscando horários...</p>}
                {!isLoadingSlots && timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTime(slot.time)}
                    className={'p-4 border-2 rounded-lg transition ' + (selectedTime === slot.time ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300')}
                  >
                    <div className={'text-lg font-semibold mb-1 ' + (selectedTime === slot.time ? 'text-blue-600' : 'text-slate-800')}>
                      {slot.time}
                    </div>
                    <div className="text-xs text-slate-500">{slot.available} fotógrafo(s)</div>
                  </button>
                ))}
              </div>
              {!isLoadingSlots && timeSlots.length === 0 && !error && (
                <p className="text-slate-500 col-span-full text-center py-4">Nenhum horário encontrado para este dia. Tente outra data.</p>
              )}
              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  <ChevronLeft className="w-5 h-5" />Voltar
                </button>
                <button onClick={goNext} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  Continuar <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Seus dados</h2>
                <p className="text-slate-600">Para confirmação</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nome *</label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Seu nome" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                  <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="seu@email.com" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">WhatsApp *</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(formatPhone(e.target.value))}
                    placeholder="(41) 99999-9999"
                    maxLength={15}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Observações</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Informações adicionais..." rows={3} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(4)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  <ChevronLeft className="w-5 h-5" />Voltar
                </button>
                <button onClick={goNext} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  Revisar <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Confirme</h2>
                <p className="text-slate-600">Revise os detalhes</p>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-2">Local</h3>
                  <p className="text-slate-600">{address}</p>
                  {complement && <p className="text-sm text-slate-500">Complemento: {complement}</p>}
                  <p className="text-sm text-slate-500">Bairro: {neighborhood}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-2">Serviços</h3>
                  <p className="text-slate-600">{getServiceNames()}</p>
                  <p className="text-sm text-slate-500">Duração: {getTotalDuration()} min</p>
                  {showPrices && (
                    <p className="text-sm font-semibold text-slate-700 mt-1">Valor Total: R$ {getTotalPrice()},00</p>
                  )}
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-2">Data e Horário</h3>
                  <p className="text-slate-600">{selectedDate?.toLocaleDateString('pt-BR')} às {selectedTime}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-2">Seus Dados</h3>
                  <p className="text-slate-600">{clientName}</p>
                  <p className="text-sm text-slate-500">{clientEmail}</p>
                  <p className="text-sm text-slate-500">{clientPhone}</p>
                  {notes && <p className="text-sm text-slate-500 mt-1">Obs: {notes}</p>}
                </div>
              </div>
              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStep(5)} disabled={isConfirming} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  <ChevronLeft className="w-5 h-5" />Voltar
                </button>
                <button onClick={confirm} disabled={isConfirming} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2 disabled:bg-blue-400">
                  {isConfirming ? 'Confirmando...' : 'Confirmar Agendamento'} <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Agendamento Solicitado!</h2>
              <p className="text-slate-600 max-w-md mx-auto">
                Seu protocolo é <span className="font-bold text-slate-800">{protocol}</span>.
                <br />
                Enviamos os detalhes para seu email. Nossa equipe confirmará em breve.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 max-w-sm mx-auto mt-6">
                <a
                  href={`https://wa.me/?text=Olá, acabei de solicitar um agendamento. Protocolo: ${protocol}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  <span className="font-bold">WhatsApp</span> (Compartilhar)
                </a>

                <a
                  href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sessão de Fotos - ${protocol}&details=Protocolo: ${protocol}%0AEndereço: ${address}&dates=${selectedDate ? selectedDate.toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 8) : ''}/${selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "").substring(0, 8) : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition"
                >
                  <Calendar className="w-5 h-5" /> Adicionar ao Google Agenda
                </a>

                <a
                  href={`mailto:?subject=Agendamento ${protocol}&body=Olá, segue o protocolo do meu agendamento: ${protocol}`}
                  className="flex items-center justify-center gap-2 w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium py-3 px-4 rounded-lg transition"
                >
                  <Mail className="w-5 h-5" /> Enviar por Email
                </a>
              </div>

              <div className="pt-6">
                <button onClick={() => window.location.href = '/agendar'} className="text-blue-600 hover:underline font-medium">
                  Novo Agendamento
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default BookingForm;
