// lib/utils.ts
// Funções utilitárias gerais

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { SERVICES, ServiceId, SLOT_CONFIG } from './constants'

// ================================
// CLASSNAMES (Tailwind)
// ================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ================================
// FORMATAÇÃO
// ================================
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  return phone
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatTime(time: string): string {
  return time.replace(':', 'h')
}

// ================================
// CÁLCULOS DE TEMPO
// ================================
export function calculateTotalDuration(serviceIds: ServiceId[]): number {
  return serviceIds.reduce((total, id) => {
    const service = SERVICES[id]
    return total + (service?.duration || 0)
  }, 0)
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes

  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60

  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}

export function calculateSlotsNeeded(durationMinutes: number): number {
  return Math.ceil(durationMinutes / SLOT_CONFIG.intervalMinutes)
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// ================================
// GERAÇÃO DE PROTOCOLO
// ================================
export function generateProtocol(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

  return `AG${year}${month}${day}${random}`
}

// ================================
// GERAÇÃO DE TOKEN DE CANCELAMENTO
// ================================
export function generateCancellationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''

  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return token
}

// ================================
// VALIDAÇÕES
// ================================
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11
}

export function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day >= 1 && day <= 5 // Segunda a Sexta
}

export function isSaturday(date: Date): boolean {
  return date.getDay() === 6
}

export function isSunday(date: Date): boolean {
  return date.getDay() === 0
}

// ================================
// CÁLCULO DE TAXA DE CANCELAMENTO
// ================================
export function calculateCancellationFee(
  scheduledDate: Date,
  scheduledTime: string,
  serviceTotalValue: number
): { fee: number; percentage: number; canCancelOnline: boolean; message: string } {
  const [hours, minutes] = scheduledTime.split(':').map(Number)
  const scheduledDateTime = new Date(scheduledDate)
  scheduledDateTime.setHours(hours, minutes, 0, 0)

  const now = new Date()
  const hoursUntilBooking = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilBooking < 2) {
    return {
      fee: serviceTotalValue,
      percentage: 100,
      canCancelOnline: false,
      message: 'Não é possível cancelar online com menos de 2h de antecedência. Entre em contato por telefone.',
    }
  }

  if (hoursUntilBooking < 12) {
    return {
      fee: serviceTotalValue,
      percentage: 100,
      canCancelOnline: true,
      message: 'Taxa de 100% será aplicada (menos de 12h de antecedência)',
    }
  }

  if (hoursUntilBooking < 24) {
    return {
      fee: serviceTotalValue * 0.5,
      percentage: 50,
      canCancelOnline: true,
      message: 'Taxa de 50% será aplicada (entre 12-24h de antecedência)',
    }
  }

  return {
    fee: 0,
    percentage: 0,
    canCancelOnline: true,
    message: 'Cancelamento gratuito (mais de 24h de antecedência)',
  }
}

// ================================
// DATAS
// ================================
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getAvailableDates(daysAhead: number = 30): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Começa no dia seguinte (mínimo 24h de antecedência)
  let currentDate = addDays(today, 1)

  while (dates.length < daysAhead) {
    // Ignora domingos
    if (!isSunday(currentDate)) {
      dates.push(new Date(currentDate))
    }
    currentDate = addDays(currentDate, 1)
  }

  return dates
}

// ================================
// SERVIÇOS
// ================================
export function getServicesRequiringDrone(serviceIds: ServiceId[]): boolean {
  return serviceIds.some(id => id.startsWith('drone'))
}

export function getServicesRequiringVideo(serviceIds: ServiceId[]): boolean {
  return serviceIds.some(id => id.startsWith('video'))
}

// ================================
// FOTÓGRAFOS
// ================================
export function getPhotographerColor(name: string, currentColor: string | null) {
  const n = name.toLowerCase()
  if (n.includes('augusto')) return '#EF4444' // Red
  if (n.includes('renato')) return '#F97316' // Orange
  if (n.includes('rodrigo')) return '#0EA5E9' // Light Blue
  if (n.includes('rafael')) return '#22D3EE' // Cyan
  return currentColor || '#3B82F6'
}