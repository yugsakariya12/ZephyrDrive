import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Vehicle from '@/models/Vehicle';
import AdminDashboard from '@/components/AdminDashboard';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';

// Enforce backend server-side route protection (unauthenticated or non-admin redirected)
function checkAdminAuth() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      redirect('/'); // Redirect standard users to dashboard home
    }
    return decoded;
  } catch (error) {
    redirect('/login');
  }
}

async function getVehicles(adminId) {
  try {
    await connectDB();
    const vehicles = await Vehicle.find({ createdBy: adminId }).sort({ createdAt: -1 });
    // Serialize mongoose document schema objects
    return JSON.parse(JSON.stringify(vehicles));
  } catch (error) {
    console.error('Failed to retrieve vehicles for admin:', error);
    return [];
  }
}

export default async function AdminPage() {
  const user = checkAdminAuth();

  const vehicles = await getVehicles(user.userId);

  return (
    <div className="py-6">
      <AdminDashboard initialVehicles={vehicles} />
    </div>
  );
}
