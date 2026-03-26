import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: string | number): string {
  const amount = typeof value === 'string' 
    ? Number(value.replace(/\D/g, "")) / 100 
    : value;
    
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

export function parseCurrency(value: string): number {
  return Number(value.replace(/[^\d]/g, "")) / 100;
}
