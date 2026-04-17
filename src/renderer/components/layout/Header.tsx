import { useSettings } from '@hooks/useSettings';

export default function Header() {
  const { settings } = useSettings();

  return (
    <header className="p-4 h-auto flex items-center">
      {settings.business_name && (
        <h1 className="text-2xl text-slate-900">{settings.business_name}</h1>
      )}
    </header>
  );
}
