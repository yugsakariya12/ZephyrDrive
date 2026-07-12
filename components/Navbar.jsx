'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navbar({ initialUser }) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (res.ok) {
        setUser(null);
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/images/logo.jpg" alt="ZephyrDrive Logo" className="h-10 w-10 object-contain rounded-lg border border-stone-200/60 shadow-sm" />
            <span className="text-2xl font-black tracking-wider text-stone-900">
              Zephyr<span className="text-rosewood text-glow-red font-extrabold">Drive</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-base font-extrabold text-stone-700 hover:text-stone-955 transition">
              {user && user.role === 'admin' ? 'My Showroom' : 'Car Showroom'}
            </Link>
            {user && user.role === 'admin' && (
              <Link href="/admin" className="text-base font-extrabold text-rosewood hover:text-red-700 transition">
                Car Management
              </Link>
            )}
          </nav>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end text-sm">
                <span className="font-bold text-stone-800">{user.email}</span>
                <span className="capitalize text-xs text-rosewood bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 font-black tracking-wide mt-0.5">
                  {user.role}
                </span>
              </div>
              
              {user.role === 'admin' && (
                <Link href="/admin" className="md:hidden text-xs font-black text-rosewood bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-100 transition">
                  Manage
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="text-sm font-black text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-6 py-2.5 rounded-lg border border-stone-200/80 transition whitespace-nowrap"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-bold text-stone-750 hover:text-stone-950 px-5 py-2.5 transition whitespace-nowrap"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm font-black text-white bg-rosewood hover:bg-rose-700 px-6 py-2.5 rounded-lg transition shadow-button-glow whitespace-nowrap"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
