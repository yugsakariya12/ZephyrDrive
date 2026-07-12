import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'ZephyrDrive - Luxury Car Showroom & Management',
  description: 'Manage, search, purchase, and restock high-performance luxury vehicles in a state-of-the-art interactive catalog.',
};

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';

function getUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    return null;
  }
}

export default function RootLayout({ children }) {
  const user = getUser();

  return (
    <html lang="en">
      <body className="bg-alabaster text-stone-800 min-h-screen flex flex-col selection:bg-rose-100 selection:text-rose-900">
        <Navbar initialUser={user} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
