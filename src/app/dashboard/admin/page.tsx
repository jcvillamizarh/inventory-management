'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id: number;
  name: string;
  category: string;
  type: string;
  unitBase: string;
  stockMinimo: string | null;
  presentationQuantity: string;
};

type Provider = {
  id: number;
  name: string;
  nit: string | null;
  phone: string | null;
  address: string | null;
};

type User = {
  id: string;
  username: string;
  role: string;
  active: boolean;
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const isAdmin = user?.role === 'ADMINISTRADOR' || user?.role === 'admin';
  const isConsulta = user?.role === 'CONSULTA' || user?.role === 'consulta';

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);

          const userIsAdmin = userData.role === 'ADMINISTRADOR' || userData.role === 'admin';
          const userIsConsulta = userData.role === 'CONSULTA' || userData.role === 'consulta';

          if (userIsConsulta) {
            router.push('/dashboard/reports');
          } else if (!userIsAdmin) {
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

  const [activeTab, setActiveTab] = useState<'products' | 'providers' | 'users'>('products');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    type: 'SECO_NO_PERECEDERO',
    unit: '',
    stockMinimo: '',
    presentationQuantity: '',
  });

  // Providers state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerForm, setProviderForm] = useState({
    name: '',
    nit: '',
    phone: '',
    address: '',
  });

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'OPERADOR',
  });

  useEffect(() => {
    fetchProducts();
    fetchProviders();
    fetchUsers();
  }, []);

  // Auto-clear success and error messages after 4 seconds
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess('');
        setError('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const stockMinimoValue = productForm.type === 'SECO_NO_PERECEDERO' 
        ? (productForm.stockMinimo ? parseFloat(productForm.stockMinimo) : null)
        : null;
      
      const payload = {
        name: productForm.name,
        category: productForm.category,
        type: productForm.type,
        unitBase: productForm.unit,
        stockMinimo: stockMinimoValue !== null && isNaN(stockMinimoValue) ? null : stockMinimoValue,
        presentationQuantity: parseFloat(productForm.presentationQuantity),
      };

      let response;
      if (editingProductId) {
        response = await fetch(`/api/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingProductId }),
        });
      } else {
        response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al guardar producto');
        return;
      }

      setSuccess(editingProductId ? 'Producto actualizado correctamente' : 'Producto creado exitosamente');
      setProductForm({ name: '', category: '', type: 'SECO_NO_PERECEDERO', unit: '', stockMinimo: '', presentationQuantity: '' });
      setEditingProductId(null);
      fetchProducts();
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      category: product.category,
      type: product.type,
      unit: product.unitBase,
      stockMinimo: product.stockMinimo !== null ? product.stockMinimo.toString() : '',
      presentationQuantity: product.presentationQuantity.toString(),
    });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setProductForm({ name: '', category: '', type: 'SECO_NO_PERECEDERO', unit: '', stockMinimo: '', presentationQuantity: '' });
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerForm),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al crear proveedor');
        return;
      }

      setSuccess('Proveedor creado exitosamente');
      setProviderForm({ name: '', nit: '', phone: '', address: '' });
      fetchProviders();
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al crear usuario');
        return;
      }

      setSuccess('Usuario creado exitosamente');
      setUserForm({ username: '', password: '', role: 'OPERADOR' });
      fetchUsers();
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              Administración
            </h2>
            <p className="text-slate-600 mt-1">Gestión de catálogos del sistema</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-2 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 px-4 border-b-2 font-bold text-sm flex items-center space-x-2 transition-all duration-200 ${
                activeTab === 'products'
                  ? 'border-amber-500 text-amber-600 bg-amber-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Productos</span>
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`py-4 px-4 border-b-2 font-bold text-sm flex items-center space-x-2 transition-all duration-200 ${
                activeTab === 'providers'
                  ? 'border-amber-500 text-amber-600 bg-amber-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Proveedores</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-4 border-b-2 font-bold text-sm flex items-center space-x-2 transition-all duration-200 ${
                activeTab === 'users'
                  ? 'border-amber-500 text-amber-600 bg-amber-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>Usuarios</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6 flex items-center shadow-sm animate-in slide-in-from-top-2 duration-300">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl mb-6 flex items-center shadow-sm animate-in slide-in-from-top-2 duration-300">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gestión de Productos</h3>
                  <p className="text-sm text-slate-500">Catálogo para registro de entradas</p>
                </div>
              </div>

              <form onSubmit={handleCreateProduct} className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Categoría</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                      required
                    >
                      <option value="">Seleccione una categoría</option>
                      <option value="MATERIA_PRIMA">Materia Prima</option>
                      <option value="PRODUCTO_TERMINADO">Producto Terminado</option>
                      <option value="MATERIAL_DE_EMPAQUE">Material de empaque</option>
                      <option value="PRODUCTOS_L_D">Productos L & D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo</label>
                    <select
                      value={productForm.type}
                      onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                      required
                    >
                      <option value="SECO_NO_PERECEDERO">Seco No Perecedero</option>
                      <option value="PERECEDERO">Perecedero</option>
                      <option value="NO_APLICA">No Aplica</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Unidad de Medida</label>
                    <select
                      value={productForm.unit}
                      onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                      required
                    >
                      <option value="">Seleccione una unidad</option>
                      <option value="KILOGRAMOS">Kilogramos</option>
                      <option value="LITROS">Litros</option>
                      <option value="UNIDADES">Unidades</option>
                      <option value="GRAMOS">Gramos</option>
                      <option value="MILILITROS">Mililitros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Cantidad de la Medida</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={productForm.presentationQuantity}
                      onChange={(e) => setProductForm({ ...productForm, presentationQuantity: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                      placeholder="Ej: 2"
                      required
                    />
                  </div>
                  {productForm.type === 'SECO_NO_PERECEDERO' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Stock Mínimo</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.stockMinimo}
                        onChange={(e) => setProductForm({ ...productForm, stockMinimo: e.target.value })}
                        className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                        required
                      />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 text-base font-bold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-500/50 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 tracking-wide"
                  >
                    {isLoading ? 'GUARDANDO...' : editingProductId ? 'GUARDAR CAMBIOS' : 'CREAR PRODUCTO'}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="py-3 px-4 text-base font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-500/50 focus:ring-offset-2 transition-all duration-200"
                    >
                      CANCELAR
                    </button>
                  )}
                </div>
              </form>

              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 pl-12 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                  />
                  <svg
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Tipo</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Unidad</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Cantidad/Presentación</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Stock Mínimo</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {products
                      .filter((product) =>
                        product.name.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{product.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{product.unitBase}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {parseFloat(product.presentationQuantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {product.stockMinimo !== null ? parseFloat(product.stockMinimo).toFixed(2) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="text-slate-400 hover:text-amber-500 transition-colors duration-200"
                            title="Editar producto"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gestión de Proveedores</h3>
                  <p className="text-sm text-slate-500">Catálogo de proveedores</p>
                </div>
              </div>

              <form onSubmit={handleCreateProvider} className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre Comercial</label>
                    <input
                      type="text"
                      value={providerForm.name}
                      onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">NIT</label>
                    <input
                      type="text"
                      value={providerForm.nit}
                      onChange={(e) => setProviderForm({ ...providerForm, nit: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200 placeholder:text-slate-400"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Teléfono</label>
                    <input
                      type="text"
                      value={providerForm.phone}
                      onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200 placeholder:text-slate-400"
                      placeholder="Opcional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Dirección</label>
                    <input
                      type="text"
                      value={providerForm.address}
                      onChange={(e) => setProviderForm({ ...providerForm, address: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200 placeholder:text-slate-400"
                      placeholder="Opcional"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 w-full py-3 px-4 text-base font-bold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-500/50 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 tracking-wide"
                >
                  {isLoading ? 'CREANDO...' : 'CREAR PROVEEDOR'}
                </button>
              </form>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">NIT</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Teléfono</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Dirección</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {providers.map((provider) => (
                      <tr key={provider.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{provider.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{provider.nit || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{provider.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{provider.address || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gestión de Usuarios</h3>
                  <p className="text-sm text-slate-500">Seguridad del sistema</p>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="bg-slate-50 rounded-xl p-6 mb-6 border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de Usuario</label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Rol</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full px-4 py-3.5 text-base bg-slate-50 rounded-xl border-0 focus:ring-2 focus:ring-slate-900 transition-all duration-200"
                      required
                    >
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                      <option value="OPERADOR">OPERADOR</option>
                      <option value="CONSULTA">CONSULTA</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-4 w-full py-3 px-4 text-base font-bold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-500/50 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 tracking-wide"
                >
                  {isLoading ? 'CREANDO...' : 'CREAR USUARIO'}
                </button>
              </form>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Rol</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{user.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.active ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
