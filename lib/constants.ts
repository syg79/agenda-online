// lib/constants.ts
// Constantes do sistema de agendamento

// ================================
// SERVIÇOS DISPONÍVEIS
// ================================
export const SERVICES = {
  photo: {
    id: 'photo',
    name: 'Fotos do Imóvel',
    duration: 40,
    description: 'Ensaio fotográfico completo do imóvel',
    icon: 'Camera',
  },
  video_landscape: {
    id: 'video_landscape',
    name: 'Vídeo Paisagem',
    duration: 50,
    description: 'Vídeo horizontal para portais e sites',
    icon: 'Video',
  },
  video_portrait: {
    id: 'video_portrait',
    name: 'Vídeo Retrato',
    duration: 50,
    description: 'Vídeo vertical para Reels e TikTok',
    icon: 'Smartphone',
  },
  drone_photo: {
    id: 'drone_photo',
    name: 'Drone - Fotos',
    duration: 25,
    description: 'Fotos aéreas do imóvel e região',
    icon: 'Plane',
  },
  drone_photo_video: {
    id: 'drone_photo_video',
    name: 'Drone - Fotos e Vídeo',
    duration: 40,
    description: 'Fotos e vídeo aéreos completos',
    icon: 'Plane',
  },
} as const

export type ServiceId = keyof typeof SERVICES

// ================================
// HORÁRIOS DE FUNCIONAMENTO
// ================================
export const OPERATING_HOURS = {
  weekdays: {
    start: '08:00',
    end: '17:30',
  },
  saturday: {
    start: '08:00',
    end: '13:00',
  },
  sunday: null, // Não atende
} as const

// ================================
// CONFIGURAÇÕES DE SLOTS
// ================================
export const SLOT_CONFIG = {
  intervalMinutes: 30,      // Slots de 30 em 30 min
  minAdvanceHours: 24,      // Mínimo 24h de antecedência
  maxAdvanceDays: 30,       // Máximo 30 dias no futuro
  lockDurationMinutes: 10,  // Bloqueio temporário durante agendamento
} as const

// ================================
// REGRAS DE CANCELAMENTO
// ================================
export const CANCELLATION_RULES = {
  freeUntilHours: 24,       // Grátis até 24h antes
  halfFeeUntilHours: 12,    // 50% entre 12-24h
  fullFeeUnderHours: 12,    // 100% com menos de 12h
  noOnlineCancelHours: 2,   // Não permite online com menos de 2h
} as const

// ================================
// FOTÓGRAFOS E CAPACIDADES
// ================================
export const PHOTOGRAPHER_CAPABILITIES = {
  augusto: ['photo', 'video_landscape', 'video_portrait'],
  renato: ['photo'],
  rafael: ['photo', 'video_landscape', 'video_portrait', 'drone_photo', 'drone_photo_video'],
  rodrigo: ['photo'],
} as const

// ================================
// BAIRROS DE CURITIBA (WHITELIST)
// ================================
export const CURITIBA_NEIGHBORHOODS = [
  'Água Verde',
  'Alto da Glória',
  'Alto da XV',
  'Bacacheri',
  'Batel',
  'Bigorrilho',
  'Boa Vista',
  'Bom Retiro',
  'Cabral',
  'Campina do Siqueira',
  'Campo Comprido',
  'Centro',
  'Centro Cívico',
  'Cristo Rei',
  'Ecoville',
  'Hugo Lange',
  'Jardim Botânico',
  'Jardim das Américas',
  'Jardim Social',
  'Juvevê',
  'Mercês',
  'Mossunguê',
  'Pilarzinho',
  'Portão',
  'Prado Velho',
  'Rebouças',
  'Santa Felicidade',
  'Santo Inácio',
  'São Francisco',
  'Seminário',
  'Vila Izabel',
] as const

// ================================
// MUNICÍPIOS RMC (BLACKLIST)
// ================================
export const RMC_MUNICIPALITIES = [
  'Almirante Tamandaré',
  'Araucária',
  'Campina Grande do Sul',
  'Campo Largo',
  'Campo Magro',
  'Colombo',
  'Fazenda Rio Grande',
  'Pinhais',
  'Piraquara',
  'Quatro Barras',
  'São José dos Pinhais',
] as const

// ================================
// MENSAGENS DO SISTEMA
// ================================
export const MESSAGES = {
  coverage: {
    approved: 'Atendemos sua região! Continue o agendamento.',
    checking: 'Verificando disponibilidade na sua região...',
    rejected: 'Esta região ainda não é atendida pelo agendamento online.',
    marginArea: 'Sua região está no limite de atendimento. Verificando disponibilidade...',
  },
  booking: {
    success: 'Agendamento confirmado com sucesso!',
    conflict: 'Este horário não está mais disponível. Por favor, escolha outro.',
    error: 'Ocorreu um erro. Por favor, tente novamente.',
  },
  cancellation: {
    free: 'Cancelamento gratuito (mais de 24h de antecedência)',
    halfFee: 'Taxa de 50% será aplicada (12-24h de antecedência)',
    fullFee: 'Taxa de 100% será aplicada (menos de 12h)',
    tooLate: 'Não é possível cancelar online com menos de 2h. Entre em contato por telefone.',
  },
} as const

// ================================
// CONTATO
// ================================
export const CONTACT = {
  phone: '(41) 99999-9999',
  whatsapp: '5541999999999',
  email: 'contato@seudominio.com.br',
} as const