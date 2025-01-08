//src\lib\utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function generateBarcode(): string {
  const sequence = Math.floor(1000 + Math.random() * 9000);
  return `NETREF${sequence}`;
}