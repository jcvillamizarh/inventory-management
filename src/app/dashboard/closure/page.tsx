'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DailyClosurePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    productId: '',
    physicalStock: '',
  });
  const [calculatedData, setCalculatedData] = useState({
    initialStock: 0,
    totalEntries: 0,
    calculatedConsumption: 0,
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

  const handleProductChange = async (productId: string) => {
    setFormData({ ...formData, productId });
    
    if (productId) {
      // Fetch current stock for the selected product
      try {
        const response = await fetch(`/api/inventory/stock-info/${productId}`);
        if (response.ok) {
          const data = await response.json();
          
          setCalculatedData({
            initialStock: data.currentStock,
            totalEntries: 0,
            calculatedConsumption: 0,
          });
        }
      } catch (err) {
        console.error('Error fetching product data:', err);
      }
    }
  };

  const isFormValid = formData.productId && formData.physicalStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const sessionResponse = await fetch('/api/auth/session');
      const sessionUser = await sessionResponse.json();

      const response = await fetch('/api/inventory/closure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: parseInt(formData.productId),
          userId: sessionUser.id,
          physicalStock: parseFloat(formData.physicalStock),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al procesar cierre');
        return;
      }

      setSuccess('Cierre diario procesado exitosamente');
      setFormData({
        productId: '',
        physicalStock: '',
      });
      setCalculatedData({
        initialStock: 0,
        totalEntries: 0,
        calculatedConsumption: 0,
      });
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableStock = calculatedData.initialStock;
  const potentialConsumption = availableStock - Number(formData.physicalStock || 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Cierre Diario
            </h2>
            <p className="text-slate-600 mt-1">Reconteo nocturno y balance de masa</p>
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
                onChange={(e) => handleProductChange(e.target.value)}
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

          {/* Stock Information Display */}
          {formData.productId && (
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Stock Inicial</span>
                <span className="font-bold text-slate-800">{calculatedData.initialStock.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Total Entradas Hoy</span>
                <span className="font-bold text-amber-600">+{calculatedData.totalEntries.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center border-t-2 border-slate-300 pt-3">
                <span className="text-sm font-bold text-slate-900">Stock Disponible</span>
                <span className="text-2xl font-bold text-amber-600">
                  {availableStock.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Physical Stock Input */}
          <div>
            <label htmlFor="physicalStock" className="block text-sm font-semibold text-slate-700 mb-2">
              Stock Físico (Conteo Real)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                id="physicalStock"
                type="number"
                min="0"
                step="0.01"
                value={formData.physicalStock}
                onChange={(e) => setFormData({ ...formData, physicalStock: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200 placeholder:text-slate-400"
                placeholder="Ingrese el conteo real"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Calculated Consumption */}
          {formData.physicalStock && (
            <div className={`rounded-xl p-6 border-2 ${
              potentialConsumption < 0 
                ? 'bg-red-50 border-red-300' 
                : 'bg-amber-50 border-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    potentialConsumption < 0 ? 'bg-red-500' : 'bg-amber-500'
                  }`}>
                    <svg className={`w-6 h-6 ${
                      potentialConsumption < 0 ? 'text-white' : 'text-slate-900'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${
                      potentialConsumption < 0 ? 'text-red-900' : 'text-slate-900'
                    }`}>Consumo Calculado</p>
                    <p className={`text-xs ${
                      potentialConsumption < 0 ? 'text-red-600' : 'text-slate-600'
                    }`}>(Inicial + Entradas) - Físico</p>
                  </div>
                </div>
                <span className={`text-3xl font-bold ${
                  potentialConsumption < 0 
                    ? 'text-red-600' 
                    : 'text-amber-600'
                }`}>
                  {potentialConsumption.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Validation Warning */}
          {formData.physicalStock && potentialConsumption < 0 && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              El stock físico no puede superar el stock disponible ({availableStock.toFixed(2)})
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || isLoading || potentialConsumption < 0}
            className="w-full py-3 px-4 text-base font-bold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-500/50 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 tracking-wide"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                PROCESANDO...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                PROCESAR CIERRE
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
