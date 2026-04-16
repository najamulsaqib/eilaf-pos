import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import i18n, { Locale, RTL_LOCALES } from '@i18n/index';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isRTL: boolean;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  setLocale: () => {},
  isRTL: false,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(
    () => (localStorage.getItem('locale') as Locale) ?? 'en',
  );

  const isRTL = RTL_LOCALES.includes(locale);

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem('locale', newLocale);
    setLocaleState(newLocale);
    i18n.changeLanguage(newLocale);
  };

  const value = useMemo(
    () => ({ locale, setLocale, isRTL }),
    [locale, isRTL],
  );

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale, isRTL]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
