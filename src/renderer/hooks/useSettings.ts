import { useState, useEffect, useCallback } from 'react';
import { settingsApi } from '@services/db';

const DEFAULTS: ISettings = {
  business_name: '',
  business_address: '',
  business_phone: '',
  business_email: '',
  business_tagline: '',
  receipt_show_business: '0',
  receipt_footer: '',
  sidebar_style: 'full',
};

// Module-level shared store — all hook instances share this state
let _current: ISettings = { ...DEFAULTS };
let _loaded = false;
const _listeners = new Set<(s: ISettings) => void>();

function _notify(s: ISettings) {
  _current = s;
  _listeners.forEach((fn) => fn(s));
}

export function useSettings() {
  const [settings, setSettings] = useState<ISettings>(_current);
  const [loading, setLoading] = useState(!_loaded);

  useEffect(() => {
    _listeners.add(setSettings);
    return () => {
      _listeners.delete(setSettings);
    };
  }, []);

  useEffect(() => {
    if (_loaded) return;
    (async () => {
      try {
        const data = await settingsApi.getAll();
        _notify({ ...DEFAULTS, ...data });
      } catch {
        // non-fatal
      } finally {
        _loaded = true;
        setLoading(false);
      }
    })();
  }, []);

  const save = useCallback(
    async (updates: Partial<ISettings>): Promise<void> => {
      await settingsApi.set(updates);
      _notify({ ..._current, ...updates });
    },
    [],
  );

  return { settings, loading, save };
}
