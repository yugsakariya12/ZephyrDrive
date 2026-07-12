'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard({ initialVehicles, user }) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedVehicle, setSelectedVehicle] = useState(null); // Spec Modal state
  
  // Custom Toast State
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  const [filters, setFilters] = useState({
    make: '',
    model: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  });

  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(null);

  useEffect(() => {
    setVehicles(initialVehicles);
  }, [initialVehicles]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3500);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const categoriesList = ['All', 'Coupe', 'SUV', 'Sedan', 'Electric', 'Convertible'];

  const handleCategoryPillClick = async (category) => {
    setActiveCategory(category);
    setLoading(true);
    setFilters({ make: '', model: '', category: '', minPrice: '', maxPrice: '' });

    try {
      const endpoint = category === 'All' 
        ? '/api/vehicles' 
        : `/api/vehicles/search?category=${encodeURIComponent(category)}`;
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      } else {
        showToast('Failed to fetch category vehicles.', 'error');
      }
    } catch (err) {
      showToast('A network error occurred.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setActiveCategory('');

    try {
      const queryParams = new URLSearchParams();
      if (filters.make) queryParams.append('make', filters.make);
      if (filters.model) queryParams.append('model', filters.model);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
      if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);

      const res = await fetch(`/api/vehicles/search?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
        showToast(`Found ${data.length} matching vehicles.`);
      } else {
        showToast('Search query failed.', 'error');
      }
    } catch (err) {
      showToast('Network error during filter search.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = async () => {
    setFilters({ make: '', model: '', category: '', minPrice: '', maxPrice: '' });
    setActiveCategory('All');
    setLoading(true);

    try {
      const res = await fetch('/api/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
        showToast('Filters cleared successfully.');
      } else {
        showToast('Failed to reset catalog.', 'error');
      }
    } catch (err) {
      showToast('Network error resetting filters.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (e, vehicleId, make, model) => {
    e.stopPropagation();
    setPurchaseLoading(vehicleId);

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}/purchase`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Purchase failed.', 'error');
      } else {
        setVehicles(
          vehicles.map((v) =>
            v._id === vehicleId ? { ...v, quantity: v.quantity - 1 } : v
          )
        );
        showToast(`Congratulations! You purchased the ${make} ${model}.`, 'success');
        router.refresh();
      }
    } catch (err) {
      showToast('Network error processing purchase.', 'error');
    } finally {
      setPurchaseLoading(null);
    }
  };

  const getSpecs = (price, category) => {
    const isPerformance = ['Coupe', 'Convertible', 'Sport'].includes(category);
    const hpFactor = isPerformance ? 1.5 : 1.1;
    
    const horsepower = Math.min(950, Math.floor(150 + (price / 250) * hpFactor));
    const acceleration = Math.max(1.9, (8.5 - Math.min(6.2, (price / 28000) * hpFactor)).toFixed(1));
    const topspeed = Math.min(220, Math.floor(125 + (price / 1200)));

    return { horsepower, acceleration, topspeed };
  };

  return (
    <div className="space-y-8 animate-fade-in relative text-stone-800">
      
      {/* Toast Alert Slide Container */}
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

      {/* Premium Hero Banner (Bespoke Luxury - Compact) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cream via-white to-stone-50/10 px-6 py-8 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.07)] border border-stone-200 sm:px-10 sm:py-10 transition-transform duration-500 hover:scale-[1.002]">
        <div className="relative z-10 max-w-3xl">
          <span className="text-[10px] font-black uppercase tracking-widest text-rosewood block mb-1.5">
            ZephyrDrive Concierge
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-stone-955">
            {user && user.role === 'admin' ? 'My Car Listings' : 'Luxury Car Showroom'}
          </h1>
          <p className="mt-2 text-sm sm:text-base font-semibold text-stone-600 leading-relaxed max-w-2xl">
            Welcome to the future of automotive acquisition. Browse luxury specs, filter high-performance classes, and claim ownership in one smooth click.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden lg:block opacity-15 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-rose-200 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Categories quick pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-extrabold uppercase text-stone-500 mr-2 tracking-wider">Fast Class:</span>
        {categoriesList.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryPillClick(category)}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all tracking-wider border ${
              activeCategory === category
                ? 'bg-rosewood border-rosewood text-white shadow-button-glow scale-105 font-black'
                : 'bg-white border-stone-200 text-stone-600 hover:text-stone-955 hover:border-stone-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Search and Filters Drawer */}
      <div className="glass-panel p-8 rounded-2xl shadow-heavy border border-stone-200/80">
        <h2 className="text-xs font-extrabold text-stone-955 uppercase tracking-widest mb-6 text-glow-red border-b border-stone-150 pb-3">Filter Car Options</h2>
        <form onSubmit={applyFilters} className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-5 items-end">
          <div>
            <label className="block text-[10px] font-black text-stone-650 uppercase tracking-widest mb-2">Make</label>
            <input
              type="text"
              name="make"
              value={filters.make}
              onChange={handleFilterChange}
              placeholder="e.g. Porsche"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-950 font-bold placeholder-stone-450 focus:border-rosewood focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-stone-650 uppercase tracking-widest mb-2">Model</label>
            <input
              type="text"
              name="model"
              value={filters.model}
              onChange={handleFilterChange}
              placeholder="e.g. GT3"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-955 font-bold placeholder-stone-450 focus:border-rosewood focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-stone-650 uppercase tracking-widest mb-2">Category</label>
            <input
              type="text"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              placeholder="e.g. Coupe"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-955 font-bold placeholder-stone-450 focus:border-rosewood focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-stone-650 uppercase tracking-widest mb-2">Min Price</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              placeholder="Min"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-955 font-bold placeholder-stone-450 focus:border-rosewood focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-stone-650 uppercase tracking-widest mb-2">Max Price</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              placeholder="Max"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-stone-955 font-bold placeholder-stone-450 focus:border-rosewood focus:outline-none transition"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-5 flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-stone-200 bg-white px-5 py-2.5 text-xs font-black text-stone-600 hover:text-stone-950 hover:border-stone-300 transition"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-rosewood px-6 py-2.5 text-xs font-black text-white shadow-button-glow hover:bg-rose-700 transition disabled:opacity-50 uppercase tracking-wider"
            >
              {loading ? 'Analyzing...' : 'Search Cars'}
            </button>
          </div>
        </form>
      </div>

      {/* Grid inventory rendering */}
      {vehicles.length === 0 ? (
        <div className="glass-panel text-center py-20 rounded-xl shadow-elegant">
          <p className="text-stone-500 text-sm">No vehicles match current selection parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehicles.map((v) => {
            const outOfStock = v.quantity <= 0;
            const cardSpecs = getSpecs(v.price, v.category);
            return (
              <div
                key={v._id}
                onClick={() => setSelectedVehicle(v)}
                className="glass-panel glass-panel-hover cursor-pointer flex flex-col justify-between rounded-xl overflow-hidden shadow-elegant border-l-4 border-l-rosewood border-r border-t border-b border-stone-200/45 transition-all duration-300 hover:border-r-rosewood/30 hover:shadow-elegant-hover"
              >
                {/* Visual Header Grid Panel */}
                <div className="relative h-36 w-full overflow-hidden bg-stone-100 flex items-center justify-center border-b border-stone-200/40">
                  {v.imageUrl ? (
                    <img 
                      src={v.imageUrl} 
                      alt={`${v.make} ${v.model}`} 
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-stone-300/40 text-5xl font-black select-none uppercase tracking-wide">
                      {v.make}
                    </div>
                  )}
                  <div className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-stone-600 border border-stone-200 shadow-sm z-10">
                    {v.category}
                  </div>
                </div>

                {/* Details card content */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-white">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-lg font-black text-stone-955 tracking-wide leading-tight">
                        {v.make} <span className="text-stone-600 font-bold block text-xs mt-0.5">{v.model}</span>
                      </h3>
                      <span className="text-base font-black text-rosewood bg-rose-50/70 border border-rose-100/50 px-2 py-0.5 rounded-lg text-glow-red whitespace-nowrap shadow-sm">
                        Rs. {v.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Technical Specs List */}
                    <div className="border-t border-stone-100 pt-2.5">
                      <span className="text-[10px] font-black text-stone-450 uppercase tracking-widest block mb-1.5">Technical Specs</span>
                      <ul className="space-y-1.5 text-xs font-bold text-stone-750">
                        <li className="flex items-center justify-between">
                          <span className="text-stone-500 font-semibold">⚡ Engine Output:</span>
                          <span className="text-stone-900">{cardSpecs.horsepower} HP</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-stone-500 font-semibold">⏱️ 0-60 mph:</span>
                          <span className="text-stone-900">{cardSpecs.acceleration}s</span>
                        </li>
                        <li className="flex items-center justify-between">
                          <span className="text-stone-500 font-semibold">🏁 Rated Speed:</span>
                          <span className="text-stone-900">{cardSpecs.topspeed} mph</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2.5 border-t border-stone-100">
                      <span className="text-stone-600 font-extrabold">Availability Status:</span>
                      {outOfStock ? (
                        <span className="font-black text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded text-xs uppercase tracking-wide">
                          Sold Out
                        </span>
                      ) : (
                        <span className="font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded text-xs uppercase tracking-wide">
                          {v.quantity} Available
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2.5 border-t border-stone-100">
                      <span className="text-stone-600 font-extrabold">Listed By:</span>
                      <span className="text-stone-700 font-black truncate max-w-[170px]" title={v.createdByEmail || 'admin@zephyrdrive.com'}>
                        {v.createdByEmail || 'admin@zephyrdrive.com'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    {user && user.role === 'admin' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin?edit=${v._id}`);
                        }}
                        className="w-full text-center rounded-lg bg-stone-900 border border-stone-800 py-2.5 px-4 text-xs font-black text-white hover:bg-stone-955 transition uppercase tracking-wider"
                      >
                        Manage Asset (Admin)
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handlePurchase(e, v._id, v.make, v.model)}
                        disabled={outOfStock || purchaseLoading === v._id}
                        className={`w-full rounded-lg py-2.5 px-4 text-xs font-black transition shadow-md uppercase tracking-wider ${
                          outOfStock
                            ? 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed shadow-none'
                            : 'bg-rosewood text-white hover:bg-rose-700 shadow-button-glow'
                        }`}
                      >
                        {purchaseLoading === v._id
                          ? 'Acquiring...'
                          : outOfStock
                          ? 'Sold Out'
                          : 'Acquire Asset'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Frosted Spec Sheet Details Drawer Modal */}
      {selectedVehicle && (() => {
        const specs = getSpecs(selectedVehicle.price, selectedVehicle.category);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/20 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-md p-6 rounded-2xl shadow-xl border border-stone-200/80 space-y-6 bg-white">
              
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rosewood">{selectedVehicle.category}</span>
                  <h3 className="text-xl font-bold text-stone-900">{selectedVehicle.make} {selectedVehicle.model}</h3>
                </div>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-stone-400 hover:text-stone-700 font-bold text-sm px-2.5 py-1 bg-stone-100 rounded-lg border border-stone-200"
                >
                  ✕
                </button>
              </div>

              {/* Progress Gauges */}
              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                    <span>Engine Output</span>
                    <span className="text-stone-850 font-bold">{specs.horsepower} HP</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rosewood rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (specs.horsepower / 950) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                    <span>Acceleration (0-60 mph)</span>
                    <span className="text-stone-850 font-bold">{specs.acceleration}s</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rosewood rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, ( (8.5 - specs.acceleration) / 6.6 ) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-500 mb-1">
                    <span>Top Speed Rating</span>
                    <span className="text-stone-850 font-bold">{specs.topspeed} mph</span>
                  </div>
                  <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rosewood rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, ( (specs.topspeed - 120) / 100 ) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Purchase Section */}
              <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Est. MSRP Value</span>
                  <span className="text-lg font-black text-rosewood">Rs. {selectedVehicle.price.toLocaleString('en-IN')}</span>
                </div>
                {user && user.role === 'admin' ? (
                  <button
                    onClick={() => {
                      router.push('/admin');
                      setSelectedVehicle(null);
                    }}
                    className="bg-stone-900 text-white text-xs font-bold px-5 py-2.5 rounded-lg border border-stone-800 hover:bg-stone-950 transition"
                  >
                    Manage Asset
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      handlePurchase(e, selectedVehicle._id, selectedVehicle.make, selectedVehicle.model);
                      setSelectedVehicle(null);
                    }}
                    disabled={selectedVehicle.quantity <= 0 || purchaseLoading === selectedVehicle._id}
                    className="bg-rosewood text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-button-glow hover:bg-rose-700 transition disabled:opacity-50"
                  >
                    Acquire Vehicle
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
