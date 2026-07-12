'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Invalid credentials.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setServerError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-12 sm:px-6 lg:px-8 animate-fade-in text-stone-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold tracking-wider text-stone-900">
          Sign In to <span className="text-rosewood text-glow-red font-extrabold">ZephyrDrive</span>
        </h2>
        <p className="mt-2 text-center text-sm text-stone-500">
          Or{' '}
          <Link href="/register" className="font-semibold text-rosewood hover:underline">
            register a new elite account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel py-8 px-4 shadow-elegant sm:rounded-xl sm:px-10 border border-stone-200 bg-white">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-4">
                <p className="text-sm text-red-600 font-semibold">{serverError}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                Email Address
              </label>
              <div className="mt-1.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border bg-stone-50 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-rosewood focus:outline-none focus:ring-1 focus:ring-rosewood sm:text-sm transition ${
                    errors.email ? 'border-red-500' : 'border-stone-200'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border bg-stone-50 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-rosewood focus:outline-none focus:ring-1 focus:ring-rosewood sm:text-sm transition ${
                    errors.password ? 'border-red-500' : 'border-stone-200'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-rosewood py-2.5 px-4 text-xs font-bold text-white shadow-button-glow hover:bg-rose-700 focus:outline-none transition disabled:opacity-50"
              >
                {loading ? 'Authorizing...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
