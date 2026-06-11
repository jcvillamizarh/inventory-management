export interface Product {
  id: number;
  name: string;
  category: 'MATERIA_PRIMA' | 'PRODUCTO_TERMINADO' | 'MATERIAL_DE_EMPAQUE' | 'PRODUCTOS_L_D';
  type: 'SECO_NO_PERECEDERO' | 'PERECEDERO' | 'NO_APLICA';
  unitBase: 'KILOGRAMOS' | 'LITROS' | 'UNIDADES' | 'GRAMOS' | 'MILILITROS';
  stockMinimo: number | null;
  presentationQuantity: number;
}

export interface IProductRepository {
  findById(id: number): Promise<Product | null>;
  findByName(name: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  save(product: Omit<Product, 'id'>): Promise<Product>;
  update(id: number, product: Partial<Omit<Product, 'id'>>): Promise<Product>;
}
