import React, { useState } from 'react';
import { MapPin, Clock, Camera, Video, Plane, Check, ChevronRight, ChevronLeft, AlertCircle, Phone } from 'lucide-react';

function BookingSystem() {
  const neighborhoods = ['Centro', 'Batel', 'Água Verde', 'Cabral', 'Bigorrilho', 'Juvevê', 'Mercês', 'Alto da Glória', 'Cristo Rei', 'Jardim Social', 'Rebouças', 'Champagnat', 'Bom Retiro', 'Ahú', 'São Francisco'];
  
  const blockedCities = ['Araucária', 'São José dos Pinhais', 'Colombo', 'Pinhais', 'Fazenda Rio Grande', 'Campo Largo', 'Almirante Tamandaré'];
  
  const photographers = [
    { id: 1, name: 'Augusto', services: ['photo', 'video'] },
    { id: 2, name: 'Renato', services: ['photo'] },
    { id: 3, name: 'Rafael', services: ['photo', 'video', 'drone'] },
    { id: 4, name: 'Rodrigo', services: ['photo'] }
  ];
  
  const services = [
    { id: 'photo', name: 'Fotos', duration: 40, icon: Camera, description: 'Sessão fotográfica completa' },
    { id: 'video_landscape', name: 'Vídeo Paisagem', duration: 50, icon: Video, description: 'Vídeo horizontal (YouTube)' },
    { id: 'video_portrait', name: 'Vídeo Retrato', duration: 50, icon: Video, description: 'Vídeo vertical (Reels/Shorts)' },
    { id: 'drone_photo', name: 'Drone - Fotos', duration: 25, icon: Plane, description: 'Imagens aéreas' },
    { id: 'drone_photo_video', name: 'Drone - Fotos + Vídeo', duration: 40, icon: Plane, description: 'Imagens e vídeo aéreos' }
  ];

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [protocol, setProtocol] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleAddressInput = (value) => {
    setAddress(value);
    if (value.length > 3) {
      const mockData = [
        { street: 'Rua XV de Novembro', number: '1000', neighborhood: 'Centro', city: 'Curitiba', state: 'PR' },
        { street: 'Rua Marechal Deodoro', number: '500', neighborhood: 'Centro', city: 'Curitiba', state: 'PR' },
        { street: 'Avenida Batel', number: '1234', neighborhood: 'Batel', city: 'Curitiba', state: 'PR' },
        { street: 'Rua Comendador Araújo', number: '300', neighborhood: 'Centro', city: 'Curitiba', state: 'PR' },
        { street: 'Avenida Silva Jardim', number: '800', neighborhood: 'Água Verde', city: 'Curitiba', state: 'PR' }
      ];
      const filtered = mockData.filter(item => 
        item.street.toLowerCase().includes(value.toLowerCase()) ||
        item.neighborhood.toLowerCase().includes(value.toLowerCase())
      );
      const formatted = filtered.map(item => 
        item.street + ', ' + item.number + ' - ' + item.neighborhood + ', ' + item.city + ' - ' + item.state
      );
      setSuggestions(formatted);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    setAddress(suggestion);
    setSuggestions([]);
  };

  const validateAddress = () => {
    const addr = address.toLowerCase();
    for (let i = 0; i < blockedCities.length; i++) {
      if (addr.includes(blockedCities[i].toLowerCase())) {
        setError('Esta região ainda não é atendida com agendamento automatizado. Entre em contato pelo WhatsApp (41) 9999-9999');
        return false;
      }
    }
    let found = null;
    for (let i = 0; i < neighborhoods.length; i++) {
      if (addr.includes(neighborhoods[i].toLowerCase())) {
        found = neighborhoods[i];
        break;
      }
    }
    if (!found) {
      const hasCuritiba = addr.includes('curitiba') || addr.includes('cwb') || addr.includes('ctba');
      if (!hasCuritiba) {
        setError('Não conseguimos identificar o bairro. Inclua o nome do bairro.');
        return false;
      }
      found = 'Curitiba';
    }
    setNeighborhood(found);
    setError('');
    return true;
  };

  const toggleService = (serviceId) => {
    const idx = selectedServices.indexOf(serviceId);
    if (idx > -1) {
      const newServices = [...selectedServices];
      newServices.splice(idx, 1);
      setSelectedServices(newServices);
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const getTotalDuration = () => {
    let total = 0;
    for (let i = 0; i < selectedServices.length; i++) {
      const service = services.find(s => s.id === selectedServices[i]);
      if (service) total += service.duration;
    }
    return total;
  };

  const getSlotsNeeded = () => {
    return Math.ceil(getTotalDuration() / 30);
  };

  const getAvailablePhotographers = (serviceIds) => {
    const needsVideo = serviceIds.includes('video_landscape') || serviceIds.includes('video_portrait');
    const needsDrone = serviceIds.includes('drone_photo') || serviceIds.includes('drone_photo_video');
    let count = 0;
    for (let i = 0; i < photographers.length; i++) {
      const p = photographers[i];
      if (needsDrone && !p.services.includes('drone')) continue;
      if (needsVideo && !p.services.includes('video')) continue;
      if (p.services.includes('photo')) count++;
    }
    return count;
  };

  const generateTimeSlots = (date) => {
    const slots = [];
    const day = date.getDay();
    const isSaturday = day === 6;
    const isSunday = day === 0;
    if (isSunday) return [];
    const startHour = 8;
    const endHour = isSaturday ? 13 : 17.5;
    const slotsNeeded = getSlotsNeeded();
    
    for (let hour = startHour; hour < endHour; hour += 0.5) {
      const h = Math.floor(hour);
      const m = hour % 1 === 0 ? '00' : '30';
      const timeStr = h.toString().padStart(2, '0') + ':' + m;
      const timeValue = h + (m === '30' ? 0.5 : 0);
      const remainingSlots = (endHour - timeValue) / 0.5;
      
      if (remainingSlots < slotsNeeded) continue;
      
      const available = getAvailablePhotographers(selectedServices);
      if (available > 0) {
        const endTimeValue = timeValue + (slotsNeeded * 0.5);
        const endH = Math.floor(endTimeValue);
        const endM = endTimeValue % 1 === 0 ? '00' : '30';
        const endTimeStr = endH.toString().padStart(2, '0') + ':' + endM;
        slots.push({ time: timeStr, endTime: endTimeStr, available: available });
      }
    }
    return slots;
  };

  const generateCalendar = () => {
    const today = new Date();
    const calendar = [];
    
    for (let i = 1; i <= 35; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const isSunday = dayOfWeek === 0;
      
      if (i === 1 && dayOfWeek !== 0) {
        for (let j = 0; j < dayOfWeek; j++) {
          calendar.push({ type: 'empty' });
        }
      }
      
      const hasSlots = !isSunday && generateTimeSlots(date).length > 0;
      
      calendar.push({
        type: 'day',
        date: date,
        day: date.getDate(),
        month: date.getMonth(),
        weekday: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        available: hasSlots,
        isSunday: isSunday
      });
    }
    
    const weeks = [];
    for (let i = 0; i < calendar.length; i += 7) {
      const week = calendar.slice(i, i + 7);
      if (week.length > 0) {
        const firstDay = week.find(d => d.type === 'day');
        if (firstDay) {
          weeks.push({
            days: week,
            monthName: firstDay.date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          });
        }
      }
    }
    
    return weeks;
  };

  const goNext = () => {
    if (step === 1) {
      if (!address.trim()) {
        setError('Por favor, insira o endereço completo');
        return;
      }
      if (!validateAddress()) return;
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
    }
    setError('');
    setStep(step + 1);
  };

  const confirm = () => {
    const now = new Date();
    const proto = 'AG' + now.getFullYear() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0') + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setProtocol(proto);
    setStep(7);
  };

  const reset = () => {
    setStep(1);
    setAddress('');
    setComplement('');
    setNeighborhood('');
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
    return selectedServices.map(id => {
      const service = services.find(s => s.id === id);
      return service ? service.name : '';
    }).join(' + ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Nome_da_Empresa</h1>
              <p className="text-sm text-slate-500">Fotografia Imobiliária Profissional</p>
            </div>
          </div>
        </div>
      </div>

      {step < 7 && (
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ' + (s < step ? 'bg-green-500 text-white' : s === step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400')}>
                    {s < step ? <Check className="w-4 h-4" /> : s}
                  </div>
                  {s < 6 && <div className={'h-1 flex-1 mx-1 ' + (s < step ? 'bg-green-500' : 'bg-slate-200')} />}
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-slate-600">
              {step === 1 ? 'Endereço' : step === 2 ? 'Serviços' : step === 3 ? 'Data' : step === 4 ? 'Horário' : step === 5 ? 'Dados' : 'Confirmação'}
            </p>
          </div>
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
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {suggestions.length > 0 && (
                  <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectSuggestion(sug)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-b-0 text-sm"
                      >
                        <MapPin className="inline w-4 h-4 mr-2 text-slate-400" />{sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
              {error && (
                <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    {error}
                    {error.includes('WhatsApp') && (
                      <div className="mt-2">
                        <a href="https://wa.me/5541999999999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-600 font-semibold underline">
                          <Phone className="w-4 h-4" />Clique para contato
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <button onClick={goNext} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                Continuar <ChevronRight className="w-5 h-5" />
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
                      {week.days.map((item, dayIdx) => {
                        if (item.type === 'empty') {
                          return <div key={'empty' + dayIdx} className="p-3"></div>;
                        }
                        const day = item;
                        const isSelected = selectedDate && selectedDate.getDate() === day.day && selectedDate.getMonth() === day.month;
                        return (
                          <button
                            key={'day' + weekIdx + dayIdx}
                            onClick={() => day.available && setSelectedDate(day.date)}
                            disabled={!day.available}
                            className={'p-3 rounded-lg border-2 transition ' + (isSelected ? 'border-blue-600 bg-blue-50' : day.available ? 'border-slate-200 hover:border-blue-300' : 'border-slate-200 bg-slate-50 opacity-40')}
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
                {generateTimeSlots(selectedDate).map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => setSelectedTime(slot.time)}
                    className={'p-4 border-2 rounded-lg transition ' + (selectedTime === slot.time ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-blue-300')}
                  >
                    <div className={'text-lg font-semibold mb-1 ' + (selectedTime === slot.time ? 'text-blue-600' : 'text-slate-800')}>
                      {slot.time} - {slot.endTime}
                    </div>
                    <div className="text-xs text-slate-500">{slot.available} disponível</div>
                  </button>
                ))}
              </div>
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
                  <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(41) 99999-9999" className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
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
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-2">Data e Horário</h3>
                  <p className="text-slate-600">{selectedDate && selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <p className="text-sm text-slate-500">Horário: {selectedTime}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-700 mb-2">Seus Dados</h3>
                  <p className="text-slate-600">{clientName}</p>
                  <p className="text-sm text-slate-500">{clientEmail}</p>
                  <p className="text-sm text-slate-500">{clientPhone}</p>
                  {notes && <p className="text-sm text-slate-500 mt-2">Obs: {notes}</p>}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Importante</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Confirmação por email e WhatsApp</li>
                  <li>Cancelamento gratuito até 24h antes</li>
                  <li>Fotógrafo entra em contato 24h antes</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(5)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  <ChevronLeft className="w-5 h-5" />Voltar
                </button>
                <button onClick={confirm} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />Confirmar
                </button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Confirmado!</h2>
                <p className="text-slate-600">Agendamento realizado</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <p className="text-sm text-slate-600 mb-2">Protocolo</p>
                <p className="text-3xl font-bold text-blue-600">{protocol}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-slate-700 mb-3">Resumo</h3>
                <div className="space-y-2 text-sm">
                  <p>Data: {selectedDate && selectedDate.toLocaleDateString('pt-BR')}</p>
                  <p>Horário: {selectedTime}</p>
                  <p>Serviços: {getServiceNames()}</p>
                  <p>Duração: {getTotalDuration()} min</p>
                  <p>Local: {address}</p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">Próximos Passos</h3>
                <ul className="text-sm text-green-800 space-y-1 text-left list-disc list-inside">
                  <li>Confirmação enviada para {clientEmail}</li>
                  <li>Lembrete 24h antes via WhatsApp</li>
                  <li>Link de cancelamento no email</li>
                  <li>Dúvidas: (41) 9999-9999</li>
                </ul>
              </div>
              <button onClick={reset} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg">
                Novo Agendamento
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>Nome_da_Empresa 2026</p>
          <p className="mt-1">WhatsApp: (41) 9999-9999 | email@gmail.com</p>
        </div>
      </div>
    </div>
  );
}

export default BookingSystem;