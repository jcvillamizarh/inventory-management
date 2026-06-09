import { eq } from 'drizzle-orm';
import { db } from '../../../lib/db/index.js';
import { products } from '../../../lib/db/schema.js';
import type { IProductRepository, Product } from '../products.repository.js';

export class DrizzleProductRepository implements IProductRepository {
  async findById(id: number): Promise<Product | null> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const product = result[0];
    return {
      id: product.id,
      name: product.name,
      category: product.category as 'MATERIA_PRIMA' | 'PRODUCTO_TERMINADO' | 'MATERIAL_DE_EMPAQUE' | 'PRODUCTOS_L_D',
      type: product.type as 'SECO_NO_PERECEDERO' | 'PERECEDERO',
      unitBase: product.unitBase as 'KILOGRAMOS' | 'LITROS' | 'UNIDADES' | 'GRAMOS' | 'MILILITROS',
      stockMinimo: product.stockMinimo ? parseFloat(product.stockMinimo) : null,
      presentationQuantity: parseFloat(product.presentationQuantity),
    };
  }

  async findByName(name: string): Promise<Product | null> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.name, name))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const product = result[0];
    return {
      id: product.id,
      name: product.name,
      category: product.category as 'MATERIA_PRIMA' | 'PRODUCTO_TERMINADO' | 'MATERIAL_DE_EMPAQUE' | 'PRODUCTOS_L_D',
      type: product.type as 'SECO_NO_PERECEDERO' | 'PERECEDERO',
      unitBase: product.unitBase as 'KILOGRAMOS' | 'LITROS' | 'UNIDADES' | 'GRAMOS' | 'MILILITROS',
      stockMinimo: product.stockMinimo ? parseFloat(product.stockMinimo) : null,
      presentationQuantity: parseFloat(product.presentationQuantity),
    };
  }

  async findAll(): Promise<Product[]> {
    const result = await db.select().from(products);

    return result.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category as 'MATERIA_PRIMA' | 'PRODUCTO_TERMINADO' | 'MATERIAL_DE_EMPAQUE' | 'PRODUCTOS_L_D',
      type: product.type as 'SECO_NO_PERECEDERO' | 'PERECEDERO',
      unitBase: product.unitBase as 'KILOGRAMOS' | 'LITROS' | 'UNIDADES' | 'GRAMOS' | 'MILILITROS',
      stockMinimo: product.stockMinimo ? parseFloat(product.stockMinimo) : null,
      presentationQuantity: parseFloat(product.presentationQuantity),
    }));
  }

  async save(product: Omit<Product, 'id'>): Promise<Product> {
    const result = await db
      .insert(products)
      .values({
        name: product.name,
        category: product.category,
        type: product.type,
        unitBase: product.unitBase,
        stockMinimo: product.stockMinimo !== null ? product.stockMinimo.toString() : null,
        presentationQuantity: product.presentationQuantity.toString(),
      })
      .returning();

    const savedProduct = result[0];
    return {
      id: savedProduct.id,
      name: savedProduct.name,
      category: savedProduct.category as 'MATERIA_PRIMA' | 'PRODUCTO_TERMINADO' | 'MATERIAL_DE_EMPAQUE' | 'PRODUCTOS_L_D',
      type: savedProduct.type as 'SECO_NO_PERECEDERO' | 'PERECEDERO',
      unitBase: savedProduct.unitBase as 'KILOGRAMOS' | 'LITROS' | 'UNIDADES' | 'GRAMOS' | 'MILILITROS',
      stockMinimo: savedProduct.stockMinimo ? parseFloat(savedProduct.stockMinimo) : null,
      presentationQuantity: parseFloat(savedProduct.presentationQuantity),
    };
  }

  async update(id: number, product: Partial<Omit<Product, 'id'>>): Promise<Product> {
    const result = await db
      .update(products)
      .set({
        name: product.name,
        category: product.category,
        type: product.type,
        unitBase: product.unitBase,
        stockMinimo: product.stockMinimo !== null && product.stockMinimo !== undefined ? product.stockMinimo.toString() : null,
        presentationQuantity: product.presentationQuantity?.toString(),
      })
      .where(eq(products.id, id))
      .returning();

    const updatedProduct = result[0];
    return {
      id: updatedProduct.id,
      name: updatedProduct.name,
      category: updatedProduct.category as 'MATERIA_PRIMA' | 'PRODUCTO_TERMINADO' | 'MATERIAL_DE_EMPAQUE' | 'PRODUCTOS_L_D',
      type: updatedProduct.type as 'SECO_NO_PERECEDERO' | 'PERECEDERO',
      unitBase: updatedProduct.unitBase as 'KILOGRAMOS' | 'LITROS' | 'UNIDADES' | 'GRAMOS' | 'MILILITROS',
      stockMinimo: updatedProduct.stockMinimo ? parseFloat(updatedProduct.stockMinimo) : null,
      presentationQuantity: parseFloat(updatedProduct.presentationQuantity),
    };
  }
}
