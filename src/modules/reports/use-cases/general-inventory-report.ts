import type { IProductRepository } from '../../products/products.repository.js';
import type { IInventoryRepository } from '../../inventory/inventory.repository.js';

export interface GeneralInventoryItem {
  id: number;
  name: string;
  category: string;
  type: string;
  unidadMedida: string;
  cantidadMedida: number;
  stockUnidades: number;
  totalNetoMedida: number;
  stockMinimo: number | null;
}

export class GeneralInventoryReportUseCase {
  constructor(
    private readonly productRepository: IProductRepository,
    private readonly inventoryRepository: IInventoryRepository
  ) {}

  async execute(): Promise<GeneralInventoryItem[]> {
    const products = await this.productRepository.findAll();
    const stockMap = await this.inventoryRepository.getLatestPhysicalStockForAllProducts();
    
    const report: GeneralInventoryItem[] = [];

    for (const product of products) {
      const stockUnidades = stockMap.get(product.id) || 0;
      const totalNetoMedida = stockUnidades * product.presentationQuantity;

      report.push({
        id: product.id,
        name: product.name,
        category: product.category,
        type: product.type,
        unidadMedida: product.unitBase,
        cantidadMedida: product.presentationQuantity,
        stockUnidades,
        totalNetoMedida,
        stockMinimo: product.stockMinimo,
      });
    }

    return report;
  }
}
