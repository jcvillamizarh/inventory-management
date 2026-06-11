import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateInventoryExportData, InventoryExportData } from './exportador';

describe('Excel Export Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInventoryExportData', () => {
    it('should transform inventory items to export format', () => {
      const items = [
        {
          id: 1,
          name: 'Test Product',
          category: 'SECO_NO_PERECEDERO',
          stockUnidades: 100,
          cantidadMedida: 500,
          unidadMedida: 'GRAMOS',
          totalNetoMedida: 50000,
        },
      ];

      const result = generateInventoryExportData(items);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        'Referencia / Producto': 'Test Product',
        'Categoría': 'SECO_NO_PERECEDERO',
        'Stock (Unidades)': 100,
        'Presentación': '500 gramos',
        'Total Disponible': '50000 gramos',
      });
    });

    it('should handle empty array', () => {
      const result = generateInventoryExportData([]);
      expect(result).toEqual([]);
    });

    it('should handle multiple items', () => {
      const items = [
        {
          id: 1,
          name: 'Product 1',
          category: 'SECO_NO_PERECEDERO',
          stockUnidades: 100,
          cantidadMedida: 500,
          unidadMedida: 'GRAMOS',
          totalNetoMedida: 50000,
        },
        {
          id: 2,
          name: 'Product 2',
          category: 'PERECEDERO',
          stockUnidades: 50,
          cantidadMedida: 1,
          unidadMedida: 'LITROS',
          totalNetoMedida: 50,
        },
      ];

      const result = generateInventoryExportData(items);

      expect(result).toHaveLength(2);
      expect(result[0]['Referencia / Producto']).toBe('Product 1');
      expect(result[1]['Referencia / Producto']).toBe('Product 2');
    });
  });
});
