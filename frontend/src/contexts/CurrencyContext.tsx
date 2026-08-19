'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CURRENCIES, STORAGE_KEYS } from '@/constants';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate?: number;
}

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatAmount: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

// Exchange rates (in production, fetch from an API)
const EXCHANGE_RATES: Record<string, number> = {
  INR: 1,
  USD: 0.012,
  GBP: 0.0095,
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.PREFERRED_CURRENCY);
      if (saved) {
        const found = CURRENCIES.find((c) => c.code === saved);
        if (found) return found;
      }
    }
    return CURRENCIES[0]; // Default: INR
  });

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEYS.PREFERRED_CURRENCY, c.code);
  }, []);

  const formatAmount = useCallback(
    (amount: number): string => {
      const rate = EXCHANGE_RATES[currency.code] ?? 1;
      const converted = amount * rate;
      return new Intl.NumberFormat(currency.code === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.code === 'INR' ? 0 : 2,
        maximumFractionDigits: currency.code === 'INR' ? 0 : 2,
      }).format(converted);
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
