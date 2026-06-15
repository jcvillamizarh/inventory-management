'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MorningEntryPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    providerId: '',
    productId: '',
    entryDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    batchNumber: '',
    quantityUnits: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const user = await response.json();

          // Check if user is CONSULTA and redirect to reports
          if (user.role === 'CONSULTA' || user.role === 'consulta') {
            router.push('/dashboard/reports');
            return;
          }

          // Fetch providers and products on mount
          fetchProviders();
          fetchProducts();
        } else {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      }
    };

    checkSession();
  }, [router]);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const isFormValid =
    formData.providerId &&
    formData.productId &&
    formData.entryDate &&
    formData.quantityUnits;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      const response = await fetch('/api/inventory/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: parseInt(formData.providerId),
          productId: parseInt(formData.productId),
          userId: user.id,
          entryDate: formData.entryDate,
          expirationDate: formData.expirationDate || null,
          batchNumber: formData.batchNumber || null,
          quantityUnits: parseFloat(formData.quantityUnits),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al registrar entrada');
        return;
      }

      setSuccess('Entrada registrada exitosamente');
      setFormData({
        providerId: '',
        productId: '',
        entryDate: new Date().toISOString().split('T')[0],
        expirationDate: '',
        batchNumber: '',
        quantityUnits: '',
      });
      fetchProviders();
      fetchProducts();
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Registro de Entradas
            </h2>
            <p className="text-slate-600 mt-1">Ingrese los datos de las entradas de inventario</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Selection */}
          <div>
            <label htmlFor="provider" className="block text-sm font-semibold text-slate-700 mb-2">
              Proveedor
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <select
                id="provider"
                value={formData.providerId}
                onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200 appearance-none"
                disabled={isLoading}
                required
              >
                <option value="">Seleccione un proveedor</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div>
            <label htmlFor="product" className="block text-sm font-semibold text-slate-700 mb-2">
              Producto
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <select
                id="product"
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200 appearance-none"
                disabled={isLoading}
                required
              >
                <option value="">Seleccione un producto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Entry Date */}
          <div>
            <label htmlFor="entryDate" className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha de Ingreso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                id="entryDate"
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200 placeholder:text-slate-400"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Expiration Date */}
          <div>
            <label htmlFor="expirationDate" className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha de Vencimiento (Opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                id="expirationDate"
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200 placeholder:text-slate-400"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Batch Number */}
          <div>
            <label htmlFor="batchNumber" className="block text-sm font-semibold text-slate-700 mb-2">
              Lote (Opcional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <input
                id="batchNumber"
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200 placeholder:text-slate-400"
                placeholder="Ej: L1234"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Quantity Units */}
          <div>
            <label htmlFor="quantityUnits" className="block text-sm font-semibold text-slate-700 mb-2">
              Unidades
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <input
                id="quantityUnits"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantityUnits}
                onChange={(e) => setFormData({ ...formData, quantityUnits: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200 placeholder:text-slate-400"
                placeholder="Ej: 50"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading}
            className="w-full py-3 px-4 text-base font-bold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-500/50 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 tracking-wide"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                REGISTRANDO...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                REGISTRAR ENTRADA
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
