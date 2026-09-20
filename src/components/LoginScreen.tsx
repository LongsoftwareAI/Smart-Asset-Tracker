import { useState, type FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@assetmate.vn');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể đăng nhập.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-slate-950 p-4 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
        <div className="space-y-2 text-center">
          <LockKeyhole className="mx-auto h-9 w-9 text-blue-400" />
          <h1 className="text-xl font-bold">Đăng nhập AssetMate</h1>
          <p className="text-sm text-slate-400">Quản lý tài sản công trường an toàn.</p>
        </div>
        <label className="block text-sm">Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
        </label>
        <label className="block text-sm">Mật khẩu
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
        </label>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold disabled:opacity-60">
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  );
}
