import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../services/api.js';
import Button from '../../components/Button.jsx';
import Field from '../../components/Field.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={submit} noValidate>
        <img src="/images/brand/logo.webp" alt="Kalagram" />
        <h1>Admin Sign In</h1>
        <Field label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button type="submit" loading={submitting} className="btn-block">{submitting ? 'Signing in' : 'Sign In'}</Button>
      </form>
    </div>
  );
}
