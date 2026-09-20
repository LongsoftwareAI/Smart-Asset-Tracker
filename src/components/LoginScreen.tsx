import { useState, type FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
        if (password !== confirmPassword) throw new Error('Xác nhận mật khẩu chưa khớp.');
        const result = await register({ name, email, password, department });
        setMessage(result);
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else if (mode === 'forgot') {
        setMessage(await requestPasswordReset(email));
      } else {
        if (!resetToken) throw new Error('Link đặt lại mật khẩu không hợp lệ.');
        if (password !== confirmPassword) throw new Error('Xác nhận mật khẩu chưa khớp.');
        setMessage(await resetPassword(resetToken, password));
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        window.history.replaceState({}, '', '/');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể thực hiện yêu cầu.');
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
    login: 'Đăng nhập AssetMate',
    register: 'Tạo tài khoản',
    forgot: 'Đặt lại mật khẩu',
    reset: 'Chọn mật khẩu mới',
  }[mode];

  const submitLabel = {
    login: 'Đăng nhập',
    register: 'Tạo tài khoản',
    forgot: 'Gửi link đặt lại',
    reset: 'Lưu mật khẩu mới',
  }[mode];

  return (
    <main className="min-h-screen grid place-items-center bg-slate-950 p-4 text-slate-100">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="space-y-2 text-center">
          <LockKeyhole className="mx-auto h-9 w-9 text-blue-400" />
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="text-sm text-slate-400">Quản lý tài sản công trường an toàn.</p>
        </div>
        {mode === 'register' && <>
          <label className="block text-sm">Họ và tên
            <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
          </label>
          <label className="block text-sm">Phòng ban <span className="text-slate-500">(không bắt buộc)</span>
            <input value={department} onChange={(event) => setDepartment(event.target.value)} autoComplete="organization" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
          </label>
        </>}
        {mode !== 'reset' && <label className="block text-sm">Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
        </label>}
        {mode === 'forgot' && <p className="text-sm text-slate-400">Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu. Ở môi trường local không có SMTP, link được in trong terminal chạy server.</p>}
        {mode !== 'forgot' && <>
          <label className="block text-sm">Mật khẩu
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required minLength={12} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
          </label>
          {(mode === 'register' || mode === 'reset') && <label className="block text-sm">Xác nhận mật khẩu
            <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" required minLength={12} autoComplete="new-password" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
          </label>}
        </>}
        {mode === 'register' && <p className="text-sm text-slate-400">Tài khoản mới được tạo với role Nhân viên (STAFF).</p>}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold disabled:opacity-60">
          {submitting ? 'Đang xử lý…' : submitLabel}
        </button>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-blue-300">
          {mode !== 'login' && <button type="button" onClick={() => openMode('login')}>Đăng nhập</button>}
          {mode === 'login' && <>
            <button type="button" onClick={() => openMode('register')}>Tạo tài khoản</button>
            <button type="button" onClick={() => openMode('forgot')}>Quên mật khẩu?</button>
          </>}
        </div>
      </form>
    </main>
  );
}
