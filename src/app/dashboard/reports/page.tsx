'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { exportInventoryToExcel, generateInventoryExportData } from '@/lib/utils/exportador';

export default function ReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'alerts' | 'general-inventory'>('alerts');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [generalInventory, setGeneralInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          setUser(data);

          const canViewReports = data.role === 'ADMINISTRADOR' || data.role === 'CONSULTA' || data.role === 'admin' || data.role === 'consulta';

          if (!canViewReports) {
            router.push('/dashboard');
          }
        } else {
          router.push('/');
        }
      } catch (error) {
        router.push('/');
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchAlerts();
    } else if (activeTab === 'general-inventory') {
      fetchGeneralInventory();
    }
  }, [activeTab]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reports/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      } else {
        setError('Error al cargar alertas de stock');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGeneralInventory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reports/general-inventory');
      if (response.ok) {
        const data = await response.json();
        setGeneralInventory(data);
      } else {
        setError('Error al cargar inventario general');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToExcel = () => {
    // Role protection: only ADMINISTRADOR can export
    if (!user || (user.role !== 'ADMINISTRADOR' && user.role !== 'admin')) {
      return;
    }

    // Filter data based on search term
    const filteredData = generalInventory
      .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Transform data for export
    const exportData = generateInventoryExportData(filteredData);

    // Export to Excel
    exportInventoryToExcel(exportData);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Reportes Administrativos
            </h2>
            <p className="text-slate-600 mt-1">Alertas de stock e inventario general</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-2 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-4 border-b-2 font-bold text-sm flex items-center space-x-2 transition-all duration-200 ${
                activeTab === 'alerts'
                  ? 'border-amber-500 text-amber-600 bg-amber-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Alertas de Stock</span>
            </button>
            <button
              onClick={() => setActiveTab('general-inventory')}
              className={`py-4 px-4 border-b-2 font-bold text-sm flex items-center space-x-2 transition-all duration-200 ${
                activeTab === 'general-inventory'
                  ? 'border-amber-500 text-amber-600 bg-amber-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Inventario General</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Productos Bajo Stock Mínimo</h3>
                  <p className="text-sm text-slate-500">Productos que requieren reabastecimiento urgente</p>
                </div>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : alerts.length === 0 ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8 text-center">
                  <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-700 font-semibold">No hay alertas de stock</p>
                  <p className="text-green-600 text-sm mt-1">Todos los productos están por encima del mínimo</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Stock Actual
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Stock Mínimo
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Categoría
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {alerts.map((alert) => (
                        <tr key={alert.productId} className="hover:bg-red-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                            {alert.productName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
                              {alert.currentStock.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {alert.stockMinimo.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              {alert.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'general-inventory' && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">📦 Inventario General de Stock</h3>
                  <p className="text-sm text-slate-500">Total neto real disponible en la cocina</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar producto por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                    />
                  </div>
                  {user && (user.role === 'ADMINISTRADOR' || user.role === 'admin') && (
                    <button
                      onClick={handleExportToExcel}
                      className="flex items-center space-x-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                      title="Exportar a Excel"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Exportar Excel</span>
                    </button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <div className="w-full overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[1000px] divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Referencia / Producto
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Stock (Unidades)
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Presentación
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Total Disponible
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {generalInventory
                        .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((item) => {
                          const isLowStock = item.type === 'SECO_NO_PERECEDERO' && item.stockMinimo !== null && item.stockUnidades <= item.stockMinimo;
                          return (
                            <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isLowStock ? 'bg-red-50' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-sm font-semibold text-slate-900">{item.name}</span>
                                  {isLowStock && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                      Bajo Stock
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {item.stockUnidades.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                {item.cantidadMedida.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {item.unidadMedida.toLowerCase()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-bold text-slate-900">
                                  {item.totalNetoMedida.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} {item.unidadMedida.toLowerCase()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {generalInventory.length === 0 && !isLoading && (
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-8 text-center mt-4">
                  <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p className="text-slate-600 font-semibold">No hay productos registrados</p>
                  <p className="text-slate-500 text-sm mt-1">Registra productos en el panel de administración</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
