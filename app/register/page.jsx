'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || 'Registration failed.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 1500);
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
          Join <span className="text-rosewood text-glow-red font-extrabold">ZephyrDrive</span>
        </h2>
        <p className="mt-2 text-center text-sm text-stone-500">
          Or{' '}
          <Link href="/login" className="font-semibold text-rosewood hover:underline">
            sign in to your existing keys
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel py-8 px-4 shadow-elegant sm:rounded-xl sm:px-10 border border-stone-200 bg-white">
          {success ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4 text-center">
              <p className="text-sm font-semibold text-emerald-600">
                Registration successful! Redirecting to login terminal...
              </p>
            </div>
          ) : (
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
                <label htmlFor="confirmPassword" className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Confirm Password
                </label>
                <div className="mt-1.5">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full rounded-lg border bg-stone-50 px-3 py-2 text-stone-900 placeholder-stone-400 focus:border-rosewood focus:outline-none focus:ring-1 focus:ring-rosewood sm:text-sm transition ${
                      errors.confirmPassword ? 'border-red-500' : 'border-stone-200'
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="role" className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                  Account Role
                </label>
                <div className="mt-1.5">
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-stone-900 shadow-sm focus:border-rosewood focus:outline-none sm:text-sm"
                  >
                    <option value="user" className="bg-white">User (Customer)</option>
                    <option value="admin" className="bg-white">Admin (Manager)</option>
                  </select>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full justify-center rounded-lg bg-rosewood py-2.5 px-4 text-xs font-bold text-white shadow-button-glow hover:bg-rose-700 focus:outline-none transition disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
