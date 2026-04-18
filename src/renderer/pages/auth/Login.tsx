import { useState } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Button from '@components/ui/Button';
import TextField from '@components/ui/TextField';
import { useAuth } from '@contexts/AuthContext';

import logo from '../../../../assets/icon.png';

export default function LoginPage() {
  const { t } = useTranslation();
  const {
    signIn,
    sendPasswordResetOtp,
    verifyPasswordResetOtp,
    completePasswordReset,
  } = useAuth();

  const [view, setView] = useState<'login' | 'forgot' | 'otp' | 'reset'>(
    'login',
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleSignIn = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.login.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      await sendPasswordResetOtp(forgotEmail);
      setInfo(t('auth.otp.codeSent'));
      setView('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgot.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();
    try {
      await verifyPasswordResetOtp(forgotEmail, otp.trim());
      setView('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.otp.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('auth.reset.mismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('auth.reset.tooShort'));
      return;
    }
    setLoading(true);
    clearMessages();
    try {
      await completePasswordReset(newPassword);
      setView('login');
      setForgotEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setInfo(t('auth.reset.success'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.reset.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    clearMessages();
    try {
      await sendPasswordResetOtp(forgotEmail);
      setInfo(t('auth.otp.codeResent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.otp.resendError'));
    } finally {
      setLoading(false);
    }
  };

  const goBack = (to: 'login' | 'forgot' | 'otp' | 'reset') => {
    clearMessages();
    setView(to);
  };

  const subtitleKey = {
    login: 'auth.subtitle.login',
    forgot: 'auth.subtitle.forgot',
    otp: 'auth.subtitle.otp',
    reset: 'auth.subtitle.reset',
  } as const;

  return (
    <div className="min-h-screen bg-surface-raised flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-sm border border-edge p-8">
          <div className="flex flex-col items-center mb-8">
            <img
              src={logo}
              alt={t('auth.appName')}
              className="w-40 h-40 object-cover"
            />
            <h1 className="text-2xl font-bold text-ink">{t('auth.appName')}</h1>
            <p className="mt-1 text-sm text-ink-faint">
              {t(subtitleKey[view])}
            </p>
          </div>

          {/* ── Login ── */}
          {view === 'login' && (
            <form onSubmit={handleSignIn} className="space-y-5">
              <TextField
                id="email"
                label={t('auth.login.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t('auth.login.emailPlaceholder')}
              />

              <div>
                <TextField
                  id="password"
                  label={t('auth.login.password')}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder={t('auth.login.passwordPlaceholder')}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-ink-ghost hover:text-ink-dim transition-colors cursor-pointer"
                      aria-label={
                        showPassword
                          ? t('auth.login.hidePassword')
                          : t('auth.login.showPassword')
                      }
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
                <div className="mt-1.5 text-end">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setForgotEmail(email);
                      setView('forgot');
                    }}
                    className="text-xs text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
                  >
                    {t('auth.login.forgotPassword')}
                  </button>
                </div>
              </div>

              {info && (
                <div className="rounded-lg bg-stat-green-icon-bg border border-stat-green-border px-4 py-3">
                  <p className="text-sm text-stat-green-icon">{info}</p>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-stat-red-icon-bg border border-stat-red-border px-4 py-3">
                  <p className="text-sm text-stat-red-icon">{error}</p>
                </div>
              )}

              <Button type="submit" busy={loading} size="lg" className="w-full">
                {t('auth.login.submit')}
              </Button>
            </form>
          )}

          {/* ── Forgot — enter email ── */}
          {view === 'forgot' && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <p className="text-sm text-ink-faint">{t('auth.forgot.hint')}</p>

              <TextField
                id="forgot-email"
                label={t('auth.forgot.email')}
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t('auth.forgot.emailPlaceholder')}
              />

              {error && (
                <div className="rounded-lg bg-stat-red-icon-bg border border-stat-red-border px-4 py-3">
                  <p className="text-sm text-stat-red-icon">{error}</p>
                </div>
              )}

              <Button type="submit" busy={loading} size="lg" className="w-full">
                {t('auth.forgot.submit')}
              </Button>

              <button
                type="button"
                onClick={() => goBack('login')}
                className="flex items-center gap-1.5 text-sm text-ink-faint hover:text-ink transition-colors mx-auto cursor-pointer"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                {t('auth.forgot.back')}
              </button>
            </form>
          )}

          {/* ── OTP — enter code ── */}
          {view === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {info && (
                <div className="rounded-lg bg-primary-50 border border-primary-200 px-4 py-3">
                  <p className="text-sm text-primary-700">{info}</p>
                </div>
              )}

              <TextField
                id="otp"
                label={t('auth.otp.label')}
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                required
                placeholder={t('auth.otp.placeholder')}
                autoComplete="one-time-code"
              />

              {error && (
                <div className="rounded-lg bg-stat-red-icon-bg border border-stat-red-border px-4 py-3">
                  <p className="text-sm text-stat-red-icon">{error}</p>
                </div>
              )}

              <Button type="submit" busy={loading} size="lg" className="w-full">
                {t('auth.otp.submit')}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => goBack('forgot')}
                  className="flex items-center gap-1.5 text-ink-faint hover:text-ink transition-colors cursor-pointer"
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" />
                  {t('auth.otp.back')}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleResendOtp}
                  className="text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {t('auth.otp.resend')}
                </button>
              </div>
            </form>
          )}

          {/* ── Reset — new password ── */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <TextField
                id="new-password"
                label={t('auth.reset.newPassword')}
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder={t('auth.reset.passwordPlaceholder')}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="text-ink-ghost hover:text-ink-dim transition-colors"
                    aria-label={
                      showNewPassword
                        ? t('auth.login.hidePassword')
                        : t('auth.login.showPassword')
                    }
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                }
              />

              <TextField
                id="confirm-password"
                label={t('auth.reset.confirmPassword')}
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder={t('auth.reset.passwordPlaceholder')}
              />

              {error && (
                <div className="rounded-lg bg-stat-red-icon-bg border border-stat-red-border px-4 py-3">
                  <p className="text-sm text-stat-red-icon">{error}</p>
                </div>
              )}

              <Button type="submit" busy={loading} size="lg" className="w-full">
                {t('auth.reset.submit')}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-ink-ghost">
          {t('auth.footer', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}
