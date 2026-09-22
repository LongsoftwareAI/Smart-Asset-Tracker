import { useState, type FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as MESSAGES from '../../shared/messages';

type ScreenMode = 'login' | 'register' | 'forgot' | 'reset';

export function LoginScreen() {
  const { login, register, requestPasswordReset, resetPassword } = useAuth();
  const resetToken = new URLSearchParams(window.location.search).get('token') || '';
  const [mode, setMode] = useState<ScreenMode>(resetToken ? 'reset' : 'login');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('admin@assetmate.vn');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        if (password !== confirmPassword) throw new Error(MESSAGES.PASSWORD_MISMATCH);
        const result = await register({ name, email, password, department });
        setMessage(result);
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else if (mode === 'forgot') {
        setMessage(await requestPasswordReset(email));
      } else {
        if (!resetToken) throw new Error(MESSAGES.RESET_LINK_INVALID);
        if (password !== confirmPassword) throw new Error(MESSAGES.PASSWORD_MISMATCH);
        setMessage(await resetPassword(resetToken, password));
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        window.history.replaceState({}, '', '/');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : MESSAGES.ACTION_CANNOT_BE_COMPLETED);
    } finally {
      setSubmitting(false);
    }
  }

  function openMode(nextMode: ScreenMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
    if (nextMode !== 'login') setEmail('');
  }

  const title = {
    login: MESSAGES.LOGIN_TITLE,
    register: MESSAGES.REGISTER_TITLE,
    forgot: MESSAGES.FORGOT_PASSWORD_TITLE,
    reset: MESSAGES.RESET_PASSWORD_TITLE,
  }[mode];

  const submitLabel = {
    login: MESSAGES.LOGIN,
    register: MESSAGES.REGISTER,
    forgot: MESSAGES.SEND_RESET_LINK,
    reset: MESSAGES.SAVE_NEW_PASSWORD,
  }[mode];

  return (
    <main className="min-h-screen grid place-items-center bg-slate-950 p-4 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="space-y-2 text-center">
          <LockKeyhole className="mx-auto h-9 w-9 text-blue-400" />
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-slate-400">{MESSAGES.APPLICATION_TAGLINE}</p>
        </div>
        {mode === 'register' && <>
          <label className="block text-sm">{MESSAGES.FULL_NAME_LABEL}
            <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
          </label>
          <label className="block text-sm">{MESSAGES.DEPARTMENT_LABEL} <span className="text-slate-500">{MESSAGES.OPTIONAL}</span>
            <input value={department} onChange={(event) => setDepartment(event.target.value)} autoComplete="organization" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
          </label>
        </>}
        {mode !== 'reset' && <label className="block text-sm">{MESSAGES.EMAIL_LABEL}
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
        </label>}
        {mode === 'forgot' && <p className="text-sm text-slate-400">{MESSAGES.PASSWORD_RESET_HELP}</p>}
        {mode !== 'forgot' && <>
          <label className="block text-sm">{MESSAGES.PASSWORD_LABEL}
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={12} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
          </label>
          {(mode === 'register' || mode === 'reset') && <label className="block text-sm">{MESSAGES.CONFIRM_PASSWORD_LABEL}
            <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" required minLength={12} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
          </label>}
        </>}
        {mode === 'register' && <p className="text-sm text-slate-400">{MESSAGES.STAFF_ACCOUNT_HELP}</p>}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold disabled:opacity-60">
          {submitting ? MESSAGES.PROCESSING : submitLabel}
        </button>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-blue-300">
          {mode !== 'login' && <button type="button" onClick={() => openMode('login')}>{MESSAGES.LOGIN}</button>}
          {mode === 'login' && <>
            <button type="button" onClick={() => openMode('register')}>{MESSAGES.REGISTER}</button>
            <button type="button" onClick={() => openMode('forgot')}>{MESSAGES.FORGOT_PASSWORD_ACTION}</button>
          </>}
        </div>
      </form>
    </main>
  );
}
