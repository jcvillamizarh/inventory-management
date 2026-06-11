import * as XLSX from 'xlsx';

export interface InventoryExportData {
  'Referencia / Producto': string;
  'Categoría': string;
  'Stock (Unidades)': number;
  'Presentación': string;
  'Total Disponible': string;
}

export function exportInventoryToExcel(
  data: InventoryExportData[],
  filename?: string
): void {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario General');

  const defaultFilename = `inventario_general_MAJAKA_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename || defaultFilename);
}

export function generateInventoryExportData(items: any[]): InventoryExportData[] {
  return items.map((item) => ({
    'Referencia / Producto': item.name,
    'Categoría': item.category,
    'Stock (Unidades)': item.stockUnidades,
    'Presentación': `${item.cantidadMedida} ${item.unidadMedida.toLowerCase()}`,
    'Total Disponible': `${item.totalNetoMedida} ${item.unidadMedida.toLowerCase()}`,
  }));
}
