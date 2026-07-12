import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';
import Dashboard from '@/components/Dashboard';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';

// Verify authentication server-side before rendering the dashboard page
function checkAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    redirect('/login');
  }
}

async function getVehicles(adminId) {
  try {
    await connectDB();
    const query = adminId ? { createdBy: adminId } : {};
    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    // Serialize Mongoose documents to plain objects for the Client Component
    return JSON.parse(JSON.stringify(vehicles));
  } catch (error) {
    console.error('Failed to retrieve initial vehicles:', error);
    return [];
  }
}

export default async function Home() {
  // Enforce server-side route protection (unauthenticated users redirected to login)
  const user = checkAuth();

  const vehicles = await getVehicles(user.role === 'admin' ? user.userId : null);

  return (
    <div className="py-6">
      <Dashboard initialVehicles={vehicles} user={user} />
    </div>
  );
}
