import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';

// ==================== INTERFACES ====================
export interface ProductoBar {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string | null;
  disponible: boolean;
  es_combo: boolean;
  descuento?: number;
  eliminado?: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  tamanos?: TamañoProducto[];
  extras?: ExtraProducto[];
  combo_items?: ComboItem[];
}

export interface TamañoProducto {
  id?: number;
  nombre: string;
  precio: number;
}

export interface ExtraProducto {
  id?: number;
  nombre: string;
  precio: number;
}

export interface ComboItem {
  id?: number;
  item_nombre: string;
}

export interface CategoriaCount {
  categoria: string;
  total_productos: number;
}

export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  total?: number;
}

export interface ProductoCreateRequest {
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen?: string;
  disponible?: boolean;
  es_combo?: boolean;
  descuento?: number;
  tamanos?: Omit<TamañoProducto, 'id'>[];
  extras?: Omit<ExtraProducto, 'id'>[];
  combo_items?: Omit<ComboItem, 'id'>[];
}

@Injectable({
  providedIn: 'root'
})
export class BarService {

  // 🔧 FIX: URL correcta para productos del bar
  private readonly API_URL = `${environment.apiUrl}/bar`;
  
  // Cache local
  private productosSubject = new BehaviorSubject<ProductoBar[]>([]);
  public productos$ = this.productosSubject.asObservable();
  
  private categoriasSubject = new BehaviorSubject<string[]>([]);
  public categorias$ = this.categoriasSubject.asObservable();
  
  // Estados
  private cargando = false;
  private productosCache: ProductoBar[] = [];
  private categoriasCache: string[] = [];

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private toastService: ToastService
  ) {
    console.log('🍿 BarService inicializado - API URL:', this.API_URL);
    this.cargarProductosIniciales();
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  /**
   * Obtener todos los productos desde la API
   */
  getProductos(): ProductoBar[] {
    if (this.productosCache.length === 0) {
      this.cargarProductosDesdeAPI();
    }
    return this.productosCache;
  }

  /**
   * Obtener productos desde la API (Observable)
   */
  getProductosObservable(): Observable<ProductoBar[]> {
    this.cargando = true;
    
    return this.http.get<APIResponse<ProductoBar[]>>(this.API_URL).pipe(
      map(response => {
        console.log('📡 Respuesta completa de productos:', response);
        
        if (response && response.success && response.data) {
          this.productosCache = this.adaptarProductosDesdeAPI(response.data);
          this.productosSubject.next(this.productosCache);
          return this.productosCache;
        } else {
          console.warn('⚠️ Respuesta inesperada:', response);
          throw new Error(response?.message || 'Error al obtener productos');
        }
      }),
      catchError(error => {
        console.error('❌ Error completo al cargar productos:', error);
        
        // Si es 404, posiblemente no hay productos
        if (error.status === 404) {
          console.log('📝 No se encontraron productos (404) - usando array vacío');
          this.productosCache = [];
          this.productosSubject.next(this.productosCache);
          return []; // Retornar array vacío en lugar de error
        }
        
        return this.handleError('Error al cargar productos')(error);
      }),
      tap(() => this.cargando = false)
    );
  }

  /**
   * Obtener producto específico por ID
   */
  getProducto(id: number): ProductoBar | null {
    return this.productosCache.find(p => p.id === id) || null;
  }

  /**
   * Obtener producto por ID desde API
   */
  getProductoDesdeAPI(id: number): Observable<ProductoBar> {
    return this.http.get<APIResponse<ProductoBar>>(`${this.API_URL}/${id}`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          return this.adaptarProductoDesdeAPI(response.data);
        }
        throw new Error(response?.message || 'Producto no encontrado');
      }),
      catchError(this.handleError(`Error al obtener producto ${id}`))
    );
  }

  /**
   * Obtener categorías disponibles
   */
  getCategorias(): string[] {
    if (this.categoriasCache.length === 0) {
      this.cargarCategoriasDesdeAPI();
    }
    return this.categoriasCache;
  }

  /**
   * Obtener categorías desde API
   */
  getCategoriasObservable(): Observable<CategoriaCount[]> {
    return this.http.get<APIResponse<CategoriaCount[]>>(`${this.API_URL}/categories`).pipe(
      map(response => {
        if (response && response.success && response.data) {
          this.categoriasCache = ['Todas', ...response.data.map(cat => cat.categoria)];
          this.categoriasSubject.next(this.categoriasCache);
          return response.data;
        }
        throw new Error(response?.message || 'Error al obtener categorías');
      }),
      catchError(error => {
        console.warn('⚠️ Error al cargar categorías, usando fallback:', error);
        // Fallback a categorías por defecto
        this.categoriasCache = ['Todas', 'bebidas', 'snacks', 'dulces', 'combos', 'helados', 'comida'];
        this.categoriasSubject.next(this.categoriasCache);
        return [];
      })
    );
  }

  /**
   * Crear nuevo producto (solo admin)
   */
  addProducto(producto: ProductoCreateRequest): Observable<boolean> {
    if (!this.authService.isAdmin()) {
      return throwError(() => new Error('No tienes permisos de administrador'));
    }

    const productoLimpio = this.limpiarDatosParaBackend(producto);
    const headers = this.getAuthHeaders();

    return this.http.post<APIResponse<ProductoBar>>(this.API_URL, productoLimpio, { headers }).pipe(
      map(response => {
        if (response && response.success && response.data) {
          const nuevoProducto = this.adaptarProductoDesdeAPI(response.data);
          this.productosCache.push(nuevoProducto);
          this.productosSubject.next(this.productosCache);
          
          this.toastService.showSuccess(`Producto "${nuevoProducto.nombre}" creado exitosamente`);
          return true;
        }
        throw new Error(response?.message || 'Error al crear producto');
      }),
      catchError(error => {
        console.error('❌ Error completo al crear producto:', error);
        return this.handleError('Error al crear producto')(error);
      })
    );
  }

  /**
   * Toggle disponibilidad del producto
   */
  toggleDisponibilidad(id: number): boolean {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos de administrador');
      return false;
    }

    const headers = this.getAuthHeaders();

    this.http.patch<APIResponse<ProductoBar>>(`${this.API_URL}/${id}/toggle-disponibilidad`, {}, { headers }).pipe(
      map(response => {
        if (response && response.success && response.data) {
          const index = this.productosCache.findIndex(p => p.id === id);
          if (index !== -1) {
            this.productosCache[index] = this.adaptarProductoDesdeAPI(response.data);
            this.productosSubject.next(this.productosCache);
          }
          
          const estado = response.data.disponible ? 'disponible' : 'no disponible';
          this.toastService.showSuccess(`Producto marcado como ${estado}`);
          return true;
        }
        throw new Error(response?.message || 'Error al cambiar disponibilidad');
      }),
      catchError(this.handleError('Error al cambiar disponibilidad'))
    ).subscribe();

    return true;
  }

  /**
   * Eliminar producto (soft delete)
   */
  deleteProducto(id: number): boolean {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos de administrador');
      return false;
    }

    const headers = this.getAuthHeaders();

    this.http.delete<APIResponse<any>>(`${this.API_URL}/${id}`, { headers }).pipe(
      map(response => {
        if (response && response.success) {
          // Remover del cache local
          this.productosCache = this.productosCache.filter(p => p.id !== id);
          this.productosSubject.next(this.productosCache);
          
          this.toastService.showSuccess('Producto eliminado exitosamente');
          return true;
        }
        throw new Error(response?.message || 'Error al eliminar producto');
      }),
      catchError(this.handleError('Error al eliminar producto'))
    ).subscribe();

    return true;
  }

  // ==================== MÉTODOS DE VALIDACIÓN ====================

  validateProductoData(producto: Partial<ProductoBar>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!producto.nombre || !String(producto.nombre).trim()) {
      errors.push('El nombre es requerido');
    }

    if (!producto.descripcion || !String(producto.descripcion).trim()) {
      errors.push('La descripción es requerida');
    }

    if (!producto.categoria || !String(producto.categoria).trim()) {
      errors.push('La categoría es requerida');
    }

    if (!producto.precio || Number(producto.precio) <= 0) {
      errors.push('El precio debe ser mayor a 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ==================== MÉTODOS AUXILIARES ====================

  tieneOpciones(producto: ProductoBar): boolean {
    return !!(producto.tamanos?.length || producto.extras?.length);
  }

  calcularPrecioConDescuento(producto: ProductoBar): number {
    if (producto.es_combo && producto.descuento) {
      return producto.precio - producto.descuento;
    }
    return producto.precio;
  }

  contarProductosPorCategoria(categoria: string): number {
    if (categoria === 'Todas') {
      return this.productosCache.length;
    }
    return this.productosCache.filter(p => 
      p.categoria.toLowerCase() === categoria.toLowerCase()
    ).length;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  private cargarProductosIniciales(): void {
    this.getProductosObservable().subscribe({
      next: (productos) => {
        console.log(`✅ ${productos.length} productos cargados desde la API`);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos iniciales:', error);
        this.toastService.showWarning('Error al conectar con el servidor. Usando datos locales.');
      }
    });

    this.getCategoriasObservable().subscribe({
      next: (categorias) => {
        console.log(`✅ ${categorias.length} categorías cargadas desde la API`);
      },
      error: (error) => {
        console.error('❌ Error al cargar categorías:', error);
      }
    });
  }

  private cargarProductosDesdeAPI(): void {
    this.getProductosObservable().subscribe();
  }

  private cargarCategoriasDesdeAPI(): void {
    this.getCategoriasObservable().subscribe();
  }

  private limpiarDatosParaBackend(producto: ProductoCreateRequest): any {
    const productoLimpio: any = {
      nombre: String(producto.nombre || '').trim(),
      descripcion: String(producto.descripcion || '').trim(),
      precio: Number(producto.precio) || 0,
      categoria: String(producto.categoria || '').trim(),
      disponible: Boolean(producto.disponible !== false),
      es_combo: Boolean(producto.es_combo)
    };

    if (producto.imagen && String(producto.imagen).trim()) {
      productoLimpio.imagen = String(producto.imagen).trim();
    }

    if (producto.es_combo && producto.descuento !== undefined && Number(producto.descuento) >= 0) {
      productoLimpio.descuento = Number(producto.descuento);
    }

    // Limpiar arrays si existen
    if (producto.tamanos && Array.isArray(producto.tamanos)) {
      const tamanosValidos = producto.tamanos.filter(t => 
        t && t.nombre && String(t.nombre).trim() && t.precio !== undefined && Number(t.precio) >= 0
      );
      
      if (tamanosValidos.length > 0) {
        productoLimpio.tamanos = tamanosValidos.map(t => ({
          nombre: String(t.nombre).trim(),
          precio: Number(t.precio)
        }));
      }
    }

    return productoLimpio;
  }

  private adaptarProductosDesdeAPI(productos: any[]): ProductoBar[] {
    // 🔧 FIX: Verificar que productos es un array
    if (!productos || !Array.isArray(productos)) {
      console.warn('⚠️ La respuesta no contiene un array de productos:', productos);
      return [];
    }
    
    return productos.map(p => this.adaptarProductoDesdeAPI(p));
  }

  private adaptarProductoDesdeAPI(producto: any): ProductoBar {
  // 🔧 FIX: Validación más robusta
  if (!producto) {
    console.warn('⚠️ Producto vacío recibido');
    return {} as ProductoBar;
  }

  return {
    id: producto.id || 0,
    nombre: producto.nombre || '',
    descripcion: producto.descripcion || '',
    precio: parseFloat(producto.precio) || 0,
    categoria: producto.categoria || 'otros',
    imagen: producto.imagen || 'assets/bar/default.png',
    disponible: producto.disponible !== false,
    es_combo: Boolean(producto.es_combo),
    descuento: producto.descuento ? parseFloat(producto.descuento) : undefined,
    eliminado: producto.eliminado || false,
    fecha_creacion: producto.fecha_creacion,
    fecha_actualizacion: producto.fecha_actualizacion,
    // 🔧 FIX: Usar el nuevo método para limpiar duplicados
    tamanos: this.limpiarDuplicadosCorrectamente(producto.tamanos || []),
    extras: this.limpiarDuplicadosCorrectamente(producto.extras || []),
    combo_items: this.limpiarDuplicadosCorrectamente(producto.combo_items || [])
  };
}

// 🔧 FIX: Nuevo método para limpiar duplicados correctamente
private limpiarDuplicadosCorrectamente<T extends { id?: number; nombre?: string; item_nombre?: string }>(items: T[]): T[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    // Crear una clave única para cada item
    const key = item.id ? 
      `id-${item.id}` : 
      `name-${item.nombre || item.item_nombre || JSON.stringify(item)}`;
    
    // Solo agregar si no hemos visto esta clave antes
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}
  private limpiarArray<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  
  // Filtrar items null/undefined Y eliminar duplicados por JSON
  const seen = new Set<string>();
  return items
    .filter(item => item != null)
    .filter(item => {
      const key = JSON.stringify(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(mensaje: string) {
    return (error: any): Observable<never> => {
      console.error(mensaje, error);
      
      let errorMessage = mensaje;
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.toastService.showError(errorMessage);
      return throwError(() => error);
    };
  }

  // Métodos adicionales requeridos por los componentes
  updateProducto(id: number, producto: Partial<ProductoCreateRequest>): Observable<boolean> {
  if (!this.authService.isAdmin()) {
    return throwError(() => new Error('No tienes permisos de administrador'));
  }

  const productoLimpio = this.limpiarDatosParaBackend(producto as ProductoCreateRequest);
  const headers = this.getAuthHeaders();
  const url = `${this.API_URL}/${id}`;

  console.log(`📝 Actualizando producto ${id} en:`, url);
  console.log('📝 Datos de actualización:', productoLimpio);

  return this.http.put<APIResponse<ProductoBar>>(url, productoLimpio, { headers }).pipe(
    map(response => {
      console.log('✅ Respuesta de actualización de producto:', response);
      
      if (response && response.success && response.data) {
        // Actualizar el producto en el cache local
        const index = this.productosCache.findIndex(p => p.id === id);
        if (index !== -1) {
          this.productosCache[index] = this.adaptarProductoDesdeAPI(response.data);
          this.productosSubject.next(this.productosCache);
        }
        
        console.log('✅ Producto actualizado exitosamente:', response.data.nombre);
        this.toastService.showSuccess(`Producto "${response.data.nombre}" actualizado exitosamente`);
        return true;
      } else if (response && !response.hasOwnProperty('success')) {
        // Si no hay campo 'success' pero hay datos, asumir que fue exitosa
        console.log('✅ Producto actualizado (formato alternativo)');
        
        // Recargar productos para asegurar consistencia
        this.cargarProductosDesdeAPI();
        this.toastService.showSuccess('Producto actualizado exitosamente');
        return true;
      }
      
      throw new Error(response?.message || 'Error al actualizar producto');
    }),
    catchError(error => {
      console.error('❌ Error completo al actualizar producto:', error);
      console.error('❌ URL que falló:', url);
      console.error('❌ Datos que se enviaron:', productoLimpio);
      
      // Log de diagnóstico detallado
      if (error.status === 0) {
        console.error('🚫 CONEXIÓN RECHAZADA - Verificar backend y CORS');
      } else if (error.status === 400) {
        console.error('🚫 BAD REQUEST - Verificar datos del formulario');
      } else if (error.status === 401) {
        console.error('🚫 NO AUTORIZADO - Verificar token de auth');
      } else if (error.status === 404) {
        console.error('🚫 NO ENCONTRADO - Verificar que el producto existe');
      } else if (error.status === 500) {
        console.error('🚫 ERROR INTERNO - Verificar logs del backend');
      }
      
      return this.handleError('Error al actualizar producto')(error);
    })
  );
}

  getProductosPorCategoria(categoria: string): ProductoBar[] {
    if (categoria === 'Todas') {
      return this.productosCache;
    }
    return this.productosCache.filter(p => 
      p.categoria.toLowerCase() === categoria.toLowerCase()
    );
  }

  isCargando(): boolean {
    return this.cargando;
  }

  limpiarCache(): void {
    this.productosCache = [];
    this.categoriasCache = [];
    this.productosSubject.next([]);
    this.categoriasSubject.next([]);
  }

  recargar(): Observable<ProductoBar[]> {
    this.limpiarCache();
    return this.getProductosObservable();
  }
}