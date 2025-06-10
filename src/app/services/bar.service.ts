import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

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

  private readonly API_URL = 'http://localhost:3000/api/bar';
  
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
    console.log('🍿 BarService inicializado - Conectado al backend');
    this.cargarProductosIniciales();
  }

  // ==================== MÉTODOS PRINCIPALES ====================

  /**
   * Obtener todos los productos desde la API
   */
  getProductos(): ProductoBar[] {
    // Retornar cache si existe, sino cargar
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
        if (response.success) {
          this.productosCache = this.adaptarProductosDesdeAPI(response.data);
          this.productosSubject.next(this.productosCache);
          return this.productosCache;
        }
        throw new Error(response.message || 'Error al obtener productos');
      }),
      catchError(this.handleError('Error al cargar productos')),
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
        if (response.success) {
          return this.adaptarProductoDesdeAPI(response.data);
        }
        throw new Error(response.message || 'Producto no encontrado');
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
        if (response.success) {
          // Actualizar cache de categorías
          this.categoriasCache = ['Todas', ...response.data.map(cat => cat.categoria)];
          this.categoriasSubject.next(this.categoriasCache);
          return response.data;
        }
        throw new Error(response.message || 'Error al obtener categorías');
      }),
      catchError(this.handleError('Error al cargar categorías'))
    );
  }

  /**
   * Obtener productos por categoría
   */
  getProductosPorCategoria(categoria: string): ProductoBar[] {
    if (categoria === 'Todas') {
      return this.productosCache;
    }
    return this.productosCache.filter(p => 
      p.categoria.toLowerCase() === categoria.toLowerCase()
    );
  }

  /**
   * Obtener combos especiales
   */
  getCombos(): Observable<ProductoBar[]> {
    return this.http.get<APIResponse<ProductoBar[]>>(`${this.API_URL}/combos`).pipe(
      map(response => {
        if (response.success) {
          return this.adaptarProductosDesdeAPI(response.data);
        }
        throw new Error(response.message || 'Error al obtener combos');
      }),
      catchError(this.handleError('Error al cargar combos'))
    );
  }

  /**
   * Buscar productos
   */
  buscarProductos(termino: string, categoria?: string): Observable<ProductoBar[]> {
    let params = new URLSearchParams();
    if (termino.trim()) {
      params.append('q', termino.trim());
    }
    if (categoria && categoria !== 'Todas') {
      params.append('categoria', categoria);
    }

    const url = `${this.API_URL}/search?${params.toString()}`;
    
    return this.http.get<APIResponse<ProductoBar[]>>(url).pipe(
      map(response => {
        if (response.success) {
          return this.adaptarProductosDesdeAPI(response.data);
        }
        throw new Error(response.message || 'Error en la búsqueda');
      }),
      catchError(this.handleError('Error al buscar productos'))
    );
  }

  // ==================== MÉTODOS DE ADMINISTRACIÓN ====================

  /**
   * Crear nuevo producto (solo admin)
   */
  addProducto(producto: ProductoCreateRequest): Observable<boolean> {
  if (!this.authService.isAdmin()) {
    return throwError(() => new Error('No tienes permisos de administrador'));
  }

  // 🔧 LIMPIEZA Y VALIDACIÓN DE DATOS ANTES DE ENVIAR
  const productoLimpio = this.limpiarDatosParaBackend(producto);
  
  console.log('📤 Datos que se enviarán al backend:', productoLimpio);

  const headers = this.getAuthHeaders();

  return this.http.post<APIResponse<ProductoBar>>(this.API_URL, productoLimpio, { headers }).pipe(
    tap(response => {
      console.log('✅ Respuesta del servidor:', response);
    }),
    map(response => {
      if (response.success) {
        // Actualizar cache local
        const nuevoProducto = this.adaptarProductoDesdeAPI(response.data);
        this.productosCache.push(nuevoProducto);
        this.productosSubject.next(this.productosCache);
        
        this.toastService.showSuccess(`Producto "${nuevoProducto.nombre}" creado exitosamente`);
        return true;
      }
      throw new Error(response.message || 'Error al crear producto');
    }),
    catchError(error => {
      console.error('❌ Error completo:', error);
      
      // Mostrar detalles específicos del error
      if (error.status === 400) {
        console.error('📋 Detalles del error 400:', error.error);
        
        if (error.error && error.error.errors) {
          console.error('🔍 Errores de validación:', error.error.errors);
        }
      }
      
      return this.handleError('Error al crear producto')(error);
    })
  );
}
private limpiarDatosParaBackend(producto: ProductoCreateRequest): any {
  console.log('🧹 Limpiando datos de entrada:', producto);
  
  // Crear objeto base con campos requeridos
  const productoLimpio: any = {
    nombre: String(producto.nombre || '').trim(),
    descripcion: String(producto.descripcion || '').trim(),
    precio: Number(producto.precio) || 0,
    categoria: String(producto.categoria || '').trim(),
    disponible: Boolean(producto.disponible !== false), // default true
    es_combo: Boolean(producto.es_combo)
  };

  // Solo incluir campos opcionales si tienen valor válido
  if (producto.imagen && String(producto.imagen).trim()) {
    productoLimpio.imagen = String(producto.imagen).trim();
  }

  // Solo incluir descuento si es combo y tiene valor
  if (producto.es_combo && producto.descuento !== undefined && Number(producto.descuento) >= 0) {
    productoLimpio.descuento = Number(producto.descuento);
  }

  // 🔧 IMPORTANTE: Solo incluir arrays si tienen elementos válidos
  // NO enviar arrays vacíos al backend
  
  if (producto.tamanos && Array.isArray(producto.tamanos)) {
    const tamanosValidos = producto.tamanos.filter(t => 
      t && 
      typeof t === 'object' && 
      t.nombre && 
      String(t.nombre).trim() && 
      t.precio !== undefined && 
      Number(t.precio) >= 0
    );
    
    if (tamanosValidos.length > 0) {
      productoLimpio.tamanos = tamanosValidos.map(t => ({
        nombre: String(t.nombre).trim(),
        precio: Number(t.precio)
      }));
    }
    // Si no hay tamaños válidos, NO incluir el campo en absoluto
  }

  if (producto.extras && Array.isArray(producto.extras)) {
    const extrasValidos = producto.extras.filter(e => 
      e && 
      typeof e === 'object' && 
      e.nombre && 
      String(e.nombre).trim() && 
      e.precio !== undefined && 
      Number(e.precio) >= 0
    );
    
    if (extrasValidos.length > 0) {
      productoLimpio.extras = extrasValidos.map(e => ({
        nombre: String(e.nombre).trim(),
        precio: Number(e.precio)
      }));
    }
    // Si no hay extras válidos, NO incluir el campo
  }

  if (producto.combo_items && Array.isArray(producto.combo_items)) {
    const comboItemsValidos = producto.combo_items.filter(c => 
      c && 
      typeof c === 'object' && 
      c.item_nombre && 
      String(c.item_nombre).trim()
    );
    
    if (comboItemsValidos.length > 0) {
      productoLimpio.combo_items = comboItemsValidos.map(c => ({
        item_nombre: String(c.item_nombre).trim()
      }));
    }
    // Si no hay items válidos, NO incluir el campo
  }

  console.log('✅ Datos limpiados para enviar:', productoLimpio);
  console.log('📊 Campos incluidos:', Object.keys(productoLimpio));
  
  return productoLimpio;
}
  /**
   * Actualizar producto existente (solo admin)
   */
  updateProducto(id: number, producto: Partial<ProductoCreateRequest>): boolean {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos de administrador');
      return false;
    }

    const headers = this.getAuthHeaders();

    this.http.put<APIResponse<ProductoBar>>(`${this.API_URL}/${id}`, producto, { headers }).pipe(
      map(response => {
        if (response.success) {
          // Actualizar cache local
          const index = this.productosCache.findIndex(p => p.id === id);
          if (index !== -1) {
            this.productosCache[index] = this.adaptarProductoDesdeAPI(response.data);
            this.productosSubject.next(this.productosCache);
          }
          
          this.toastService.showSuccess('Producto actualizado exitosamente');
          return true;
        }
        throw new Error(response.message || 'Error al actualizar producto');
      }),
      catchError(this.handleError('Error al actualizar producto'))
    ).subscribe();

    return true; // Para compatibilidad con el código existente
  }

  /**
   * Eliminar producto (solo admin)
   */
  deleteProducto(id: number): boolean {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos de administrador');
      return false;
    }

    const headers = this.getAuthHeaders();

    this.http.delete<APIResponse<any>>(`${this.API_URL}/${id}`, { headers }).pipe(
      map(response => {
        if (response.success) {
          // Remover del cache local
          this.productosCache = this.productosCache.filter(p => p.id !== id);
          this.productosSubject.next(this.productosCache);
          
          this.toastService.showSuccess('Producto eliminado exitosamente');
          return true;
        }
        throw new Error(response.message || 'Error al eliminar producto');
      }),
      catchError(this.handleError('Error al eliminar producto'))
    ).subscribe();

    return true; // Para compatibilidad
  }

  /**
   * Cambiar disponibilidad de producto (solo admin)
   */
  toggleDisponibilidad(id: number): boolean {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos de administrador');
      return false;
    }

    const producto = this.getProducto(id);
    if (!producto) {
      this.toastService.showError('Producto no encontrado');
      return false;
    }

    // Actualizar disponibilidad localmente primero para UI responsiva
    producto.disponible = !producto.disponible;
    this.productosSubject.next(this.productosCache);

    // Enviar actualización al backend
    this.updateProducto(id, { disponible: producto.disponible });

    return true;
  }

  // ==================== MÉTODOS DE VALIDACIÓN ====================

  /**
   * Validar datos de producto
   */
  validateProductoData(producto: Partial<ProductoBar>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validaciones básicas que coinciden con el backend
  if (!producto.nombre || !String(producto.nombre).trim()) {
    errors.push('El nombre es requerido');
  } else if (String(producto.nombre).trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
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

  // Validaciones opcionales solo si los campos existen
  if (producto.imagen && String(producto.imagen).trim()) {
    const imagen = String(producto.imagen).trim();
    if (!this.isValidImageUrl(imagen)) {
      errors.push('La URL de la imagen no es válida');
    }
  }

  // Validar descuento solo si es combo
  if (producto.es_combo && producto.descuento !== undefined) {
    const descuento = Number(producto.descuento);
    if (descuento < 0) {
      errors.push('El descuento no puede ser negativo');
    } else if (descuento > Number(producto.precio || 0)) {
      errors.push('El descuento no puede ser mayor al precio base');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
private isValidImageUrl(url: string): boolean {
  try {
    // Verificar si es una ruta local válida
    if (url.startsWith('assets/')) {
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return validExtensions.some(ext => url.toLowerCase().endsWith(ext));
    }
    
    // Verificar si es una URL válida
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Verificar si un producto tiene opciones (tamaños o extras)
   */
  tieneOpciones(producto: ProductoBar): boolean {
    return !!(producto.tamanos?.length || producto.extras?.length);
  }

  /**
   * Calcular precio con descuento para combos
   */
  calcularPrecioConDescuento(producto: ProductoBar): number {
    if (producto.es_combo && producto.descuento) {
      return producto.precio - producto.descuento;
    }
    return producto.precio;
  }

  /**
   * Contar productos por categoría
   */
  contarProductosPorCategoria(categoria: string): number {
    if (categoria === 'Todas') {
      return this.productosCache.length;
    }
    return this.productosCache.filter(p => 
      p.categoria.toLowerCase() === categoria.toLowerCase()
    ).length;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Cargar productos iniciales
   */
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

  /**
   * Cargar productos desde API (método síncrono)
   */
  private cargarProductosDesdeAPI(): void {
    this.getProductosObservable().subscribe();
  }

  /**
   * Cargar categorías desde API
   */
  private cargarCategoriasDesdeAPI(): void {
    this.getCategoriasObservable().subscribe();
  }

  /**
   * Adaptar productos desde API al formato local
   */
  private adaptarProductosDesdeAPI(productos: any[]): ProductoBar[] {
    return productos.map(p => this.adaptarProductoDesdeAPI(p));
  }

  /**
   * Adaptar un producto desde API al formato local
   */
  private adaptarProductoDesdeAPI(producto: any): ProductoBar {
    return {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: parseFloat(producto.precio),
      categoria: producto.categoria,
      imagen: producto.imagen || 'assets/bar/default.png',
      disponible: producto.disponible,
      es_combo: producto.es_combo,
      descuento: producto.descuento ? parseFloat(producto.descuento) : undefined,
      fecha_creacion: producto.fecha_creacion,
      fecha_actualizacion: producto.fecha_actualizacion,
      tamanos: this.limpiarDuplicados(producto.tamanos || []),
      extras: this.limpiarDuplicados(producto.extras || []),
      combo_items: this.limpiarDuplicados(producto.combo_items || [])
    };
  }

  /**
   * Limpiar duplicados de arrays (solución temporal para duplicados en BD)
   */
  private limpiarDuplicados<T extends { id?: number; nombre?: string; item_nombre?: string }>(items: T[]): T[] {
    if (!Array.isArray(items)) return [];
    
    const vistos = new Set<string>();
    return items.filter(item => {
      const key = item.nombre || item.item_nombre || JSON.stringify(item);
      if (vistos.has(key)) return false;
      vistos.add(key);
      return true;
    });
  }

  /**
   * Obtener headers con autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Manejo de errores
   */
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

  /**
   * Verificar si está cargando
   */
  isCargando(): boolean {
    return this.cargando;
  }

  /**
   * Limpiar cache
   */
  limpiarCache(): void {
    this.productosCache = [];
    this.categoriasCache = [];
    this.productosSubject.next([]);
    this.categoriasSubject.next([]);
  }

  /**
   * Recargar datos desde API
   */
  recargar(): Observable<ProductoBar[]> {
    this.limpiarCache();
    return this.getProductosObservable();
  }
}