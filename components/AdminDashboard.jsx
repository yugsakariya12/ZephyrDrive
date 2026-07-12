'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard({ initialVehicles }) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState(initialVehicles);
  
  // Custom Toast State
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  // Fleet Statistics State
  const [stats, setStats] = useState({
    totalValue: 0,
    totalStock: 0,
    averagePrice: 0,
    outOfStockCount: 0,
  });

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    category: '',
    price: '',
    quantity: '',
    imageUrl: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [restockAmounts, setRestockAmounts] = useState({});
  const [loading, setLoading] = useState(false);

  const calculateStats = (fleetList) => {
    let value = 0;
    let stock = 0;
    let pricesSum = 0;
    let soldOutCount = 0;

    fleetList.forEach((v) => {
      value += v.price * v.quantity;
      stock += v.quantity;
      pricesSum += v.price;
      if (v.quantity <= 0) soldOutCount++;
    });

    const average = fleetList.length > 0 ? Math.round(pricesSum / fleetList.length) : 0;

    setStats({
      totalValue: value,
      totalStock: stock,
      averagePrice: average,
      outOfStockCount: soldOutCount,
    });
  };

  useEffect(() => {
    setVehicles(initialVehicles);
    calculateStats(initialVehicles);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const editIdParam = params.get('edit');
      if (editIdParam) {
        const vehicleToEdit = initialVehicles.find((v) => v._id === editIdParam);
        if (vehicleToEdit) {
          setIsEditing(true);
          setEditId(vehicleToEdit._id);
          setFormData({
            make: vehicleToEdit.make,
            model: vehicleToEdit.model,
            category: vehicleToEdit.category,
            price: vehicleToEdit.price.toString(),
            quantity: vehicleToEdit.quantity.toString(),
            imageUrl: vehicleToEdit.imageUrl || '',
          });
        }
      }
    }
  }, [initialVehicles]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('File size must be under 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        imageUrl: reader.result,
      }));
      showToast('Local image processed.');
    };
    reader.readAsDataURL(file);
  };

  const handleRestockAmountChange = (vehicleId, val) => {
    setRestockAmounts({
      ...restockAmounts,
      [vehicleId]: val,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.make || !formData.model || !formData.category || formData.price === '' || formData.quantity === '') {
      showToast('All parameters are required.', 'error');
      setLoading(false);
      return;
    }

    const payload = {
      make: formData.make.trim(),
      model: formData.model.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      imageUrl: formData.imageUrl.trim(),
    };

    if (payload.price < 0 || payload.quantity < 0) {
      showToast('Price and quantity must be non-negative.', 'error');
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        const res = await fetch(`/api/vehicles/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok) {
          const updatedFleet = vehicles.map((v) => (v._id === editId ? data : v));
          setVehicles(updatedFleet);
          calculateStats(updatedFleet);
          showToast(`Successfully updated the ${payload.make} ${payload.model}.`);
          resetForm();
        } else {
          showToast(data.error || 'Failed to update vehicle.', 'error');
        }
      } else {
        const res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();

        if (res.ok) {
          const updatedFleet = [data, ...vehicles];
          setVehicles(updatedFleet);
          calculateStats(updatedFleet);
          showToast(`Successfully created vehicle catalog for ${payload.make} ${payload.model}.`);
          resetForm();
        } else {
          showToast(data.error || 'Failed to add vehicle.', 'error');
        }
      }
      router.refresh();
    } catch (err) {
      showToast('Network error during submission.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSelect = (vehicle) => {
    setIsEditing(true);
    setEditId(vehicle._id);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      category: vehicle.category,
      price: vehicle.price.toString(),
      quantity: vehicle.quantity.toString(),
      imageUrl: vehicle.imageUrl || '',
    });
  };

  const handleDelete = async (vehicleId, make, model) => {
    if (!confirm(`Are you sure you want to remove the ${make} ${model} from the car inventory?`)) return;

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        const updatedFleet = vehicles.filter((v) => v._id !== vehicleId);
        setVehicles(updatedFleet);
        calculateStats(updatedFleet);
        showToast('Vehicle deleted successfully.');
        router.refresh();
      } else {
        showToast(data.error || 'Failed to delete vehicle.', 'error');
      }
    } catch (err) {
      showToast('Network error during deletion.', 'error');
    }
  };

  const handleRestockSubmit = async (vehicleId, make, model) => {
    const amountStr = restockAmounts[vehicleId];
    if (!amountStr) return;
    const amount = Number(amountStr);

    if (isNaN(amount) || amount <= 0 || !Number.isInteger(amount)) {
      showToast('Please provide a positive integer for restocking.', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: amount }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(`Stock updated! Restocked ${make} ${model} by +${amount} units.`);
        const updatedFleet = vehicles.map((v) => (v._id === vehicleId ? data.vehicle : v));
        setVehicles(updatedFleet);
        calculateStats(updatedFleet);
        setRestockAmounts({ ...restockAmounts, [vehicleId]: '' });
        router.refresh();
      } else {
        showToast(data.error || 'Restock failed.', 'error');
      }
    } catch (err) {
      showToast('Network error processing restock.', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ make: '', model: '', category: '', price: '', quantity: '', imageUrl: '' });
    setIsEditing(false);
    setEditId(null);
  };

  return (
    <div className="space-y-8 animate-fade-in relative text-stone-800">
      
      {/* Toast Alert Drawer */}
      {toast.visible && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl border animate-slide-in ${
          toast.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-700' 
            : 'bg-white border-stone-200 text-stone-800'
        } backdrop-blur-md`}>
          <div className={`h-2.5 w-2.5 rounded-full ${toast.type === 'error' ? 'bg-red-500' : 'bg-rosewood'}`} />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header section (styled as an elegant card banner) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cream to-white px-5 py-6 shadow-[0_15px_30px_rgba(0,0,0,0.06)] border border-stone-200/95 sm:px-8 sm:py-8">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rosewood mb-1 block">
            ZephyrDrive Administrator
          </span>
          <h1 className="text-xl font-black tracking-wider text-stone-955 sm:text-2xl">
            ZephyrDrive Car Management
          </h1>
          <p className="mt-1.5 text-xs text-stone-700 font-medium leading-relaxed">
            Modify asset values, adjust quantities, review stock listings, or remove entries from the active inventory catalog database.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden lg:block opacity-10 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-rose-200 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Fleet Stats Widgets Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border-2 border-stone-300 rounded-2xl p-4 sm:p-5 shadow-heavy transition-all duration-300 hover:-translate-y-1 hover:border-rosewood/40">
          <span className="text-[11px] font-black text-stone-650 uppercase tracking-widest block mb-1">Total Inventory Value</span>
          <span className="text-xl sm:text-2xl font-black text-rosewood block mt-0.5">Rs. {stats.totalValue.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white border-2 border-stone-300 rounded-2xl p-4 sm:p-5 shadow-heavy transition-all duration-300 hover:-translate-y-1 hover:border-rosewood/40">
          <span className="text-[11px] font-black text-stone-650 uppercase tracking-widest block mb-1">Total Cars in Stock</span>
          <span className="text-xl sm:text-2xl font-black text-stone-955 block mt-0.5">{stats.totalStock} units</span>
        </div>

        <div className="bg-white border-2 border-stone-300 rounded-2xl p-4 sm:p-5 shadow-heavy transition-all duration-300 hover:-translate-y-1 hover:border-rosewood/40">
          <span className="text-[11px] font-black text-stone-650 uppercase tracking-widest block mb-1">Average MSRP Value</span>
          <span className="text-xl sm:text-2xl font-black text-stone-955 block mt-0.5">Rs. {stats.averagePrice.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-white border-2 border-stone-300 rounded-2xl p-4 sm:p-5 shadow-heavy transition-all duration-300 hover:-translate-y-1 hover:border-rosewood/40">
          <span className="text-[11px] font-black text-stone-650 uppercase tracking-widest block mb-1">Out-of-Stock Models</span>
          <span className={`text-xl sm:text-2xl font-black block mt-0.5 ${stats.outOfStockCount > 0 ? 'text-red-600' : 'text-stone-400'}`}>
            {stats.outOfStockCount} types
          </span>
        </div>
      </div>

      {/* Grid Split Editor Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Left Form Editor */}
        <div className="lg:col-span-1 lg:border-r lg:border-stone-300 lg:pr-8">
          <div className="bg-white p-5 rounded-2xl shadow-heavy border-2 border-stone-300 sticky top-24">
            <h2 className="text-sm font-extrabold text-stone-955 uppercase tracking-widest mb-5 text-glow-red border-b-2 border-stone-200 pb-3">
              {isEditing ? 'Edit Car Details' : 'Add New Car'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-widest mb-1.5">Make</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  placeholder="e.g. BMW"
                  className="w-full rounded-lg border-2 border-stone-300 bg-stone-50 px-3.5 py-2.5 text-base text-stone-955 font-bold focus:border-rosewood focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-widest mb-1.5">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g. M4 Competition"
                  className="w-full rounded-lg border-2 border-stone-300 bg-stone-50 px-3.5 py-2.5 text-base text-stone-955 font-bold focus:border-rosewood focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-widest mb-1.5">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g. Coupe, SUV, Electric"
                  className="w-full rounded-lg border-2 border-stone-300 bg-stone-50 px-3.5 py-2.5 text-base text-stone-955 font-bold focus:border-rosewood focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-widest mb-1.5">Price (₹)</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g. 78000"
                  className="w-full rounded-lg border-2 border-stone-300 bg-stone-50 px-3.5 py-2.5 text-base text-stone-955 font-bold focus:border-rosewood focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-widest mb-1.5">Vehicle Showcase Image</label>
                <div className="relative mt-1 flex justify-center px-6 pt-4 pb-4 border-2 border-stone-300 border-dashed rounded-xl bg-stone-50 hover:bg-stone-100/50 transition">
                  <div className="space-y-1 text-center">
                    {formData.imageUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={formData.imageUrl} alt="Preview" className="h-24 w-36 object-cover rounded-lg border border-stone-200 shadow-sm" />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="text-xs font-extrabold uppercase tracking-wider text-red-650 hover:text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded"
                        >
                          Change Image
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg className="mx-auto h-10 w-10 text-stone-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-stone-600 justify-center">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-extrabold text-rosewood hover:text-red-700 focus-within:outline-none">
                            <span>Upload Local File</span>
                            <input id="file-upload" name="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                          </label>
                        </div>
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider font-bold">JPG, PNG, WEBP up to 2MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-700 uppercase tracking-widest mb-1.5">Initial Qty</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="e.g. 3"
                  className="w-full rounded-lg border-2 border-stone-300 bg-stone-50 px-3.5 py-2.5 text-base text-stone-955 font-bold focus:border-rosewood focus:outline-none transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 rounded-lg border-2 border-stone-300 bg-white py-3 px-4 text-sm font-black text-stone-650 hover:text-stone-955 hover:border-stone-455 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-rosewood py-3 px-4 text-sm font-black text-white shadow-button-glow hover:bg-rose-700 transition uppercase tracking-wider"
                >
                  {isEditing ? 'Update Asset' : 'Create Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Active Car List */}
        <div className="lg:col-span-2">
          <div className="bg-white border-2 border-stone-300 shadow-heavy rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b-2 border-stone-200 bg-stone-50/50">
              <h2 className="text-sm font-extrabold text-stone-955 uppercase tracking-widest text-glow-red">Car Inventory List</h2>
            </div>
            
            {vehicles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-stone-500 text-sm">Car inventory is empty. Add a new car listing to generate records.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stone-300 text-sm font-black text-stone-700 uppercase tracking-wider bg-stone-50">
                      <th className="px-6 py-4">Vehicle Details</th>
                      <th className="px-6 py-4">MSRP</th>
                      <th className="px-6 py-4">Stock level</th>
                      <th className="px-6 py-4">Restock Input</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-stone-100 bg-white">
                    {vehicles.map((v) => (
                      <tr key={v._id} className="hover:bg-stone-50/40 transition">
                        <td className="px-6 py-4">
                          <div className="font-black text-stone-955 text-lg">{v.make}</div>
                          <div className="text-sm text-stone-600 font-bold mt-0.5">{v.model} &bull; <span className="text-rosewood font-black bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded text-xs">{v.category}</span></div>
                          <div className="text-[11px] text-stone-450 mt-1.5 font-bold">Custodian: {v.createdByEmail || 'admin@zephyrdrive.com'}</div>
                        </td>
                        <td className="px-6 py-4 text-base font-black text-stone-955">
                          Rs. {v.price.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4">
                          {v.quantity <= 0 ? (
                            <span className="inline-flex items-center rounded bg-red-50 px-3 py-1 text-xs font-black text-red-600 border border-red-100 uppercase tracking-wider">
                              Sold Out
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-650 border border-emerald-100 uppercase tracking-wider">
                              {v.quantity} units
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 max-w-[150px]">
                            <input
                              type="number"
                              min="1"
                              placeholder="Qty"
                              value={restockAmounts[v._id] || ''}
                              onChange={(e) => handleRestockAmountChange(v._id, e.target.value)}
                              className="w-16 rounded border-2 border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-955 font-bold text-center focus:border-rosewood focus:outline-none transition"
                            />
                            <button
                              onClick={() => handleRestockSubmit(v._id, v.make, v.model)}
                              className="rounded-lg bg-stone-50 border-2 border-stone-300 text-xs font-black text-stone-700 hover:bg-rosewood hover:text-white hover:border-rosewood px-3 py-1.5 transition"
                            >
                              Restock
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
                          <button
                            onClick={() => handleEditSelect(v)}
                            className="font-black text-rosewood border-2 border-rose-150 hover:bg-rose-50 uppercase tracking-wider text-xs px-3.5 py-2 rounded-lg shadow-sm transition mr-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(v._id, v.make, v.model)}
                            className="font-black text-red-600 border-2 border-red-200 hover:bg-red-50 uppercase tracking-wider text-xs px-3.5 py-2 rounded-lg shadow-sm transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
