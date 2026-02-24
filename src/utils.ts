import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFFUID(uid: string) {
  return uid.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
}

export const SCORING = {
  PLACEMENT: {
    1: 12,
    2: 9,
    3: 8,
    4: 7,
    5: 6,
    6: 5,
    7: 4,
    8: 3,
    9: 2,
    10: 1,
  },
  KILL: 1
};
