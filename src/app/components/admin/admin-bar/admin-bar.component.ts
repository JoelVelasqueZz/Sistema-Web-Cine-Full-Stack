// src/app/components/admin/admin-bar/admin-bar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductoBar, BarService, ProductoCreateRequest } from '../../../services/bar.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-bar',
  standalone: false,
  templateUrl: './admin-bar.component.html',
  styleUrl: './admin-bar.component.css'
})
export class AdminBarComponent implements OnInit, OnDestroy {

  // Estados de imagen
  imageLoaded = false;
  imageError = false;

  // Datos principales
  productos: ProductoBar[] = [];
  productosFiltrados: ProductoBar[] = [];
  
  // Estados de vista
  vistaActual: 'lista' | 'agregar' | 'editar' = 'lista';
  cargando = true;
  procesando = false;
  
  // Formulario de producto
  productoForm: Partial<ProductoCreateRequest> = {};
  productoEditandoId = -1;
  erroresValidacion: string[] = [];
  
  // Filtros y búsqueda
  filtroCategoria = '';
  filtroDisponibilidad = '';
  terminoBusqueda = '';
  
  // Paginación
  paginaActual = 1;
  productosPorPagina = 10;
  totalPaginas = 1;
  
  // Modal de confirmación
  mostrarModalConfirmacion = false;
  productoParaEliminar = -1;
  
  private subscriptions = new Subscription();
  
  // Estadísticas
  estadisticas = {
    total: 0,
    disponibles: 0,
    noDisponibles: 0,
    combos: 0,
    porCategoria: {} as { [key: string]: number }
  };
  
  // Categorías disponibles
  readonly categoriasDisponibles = [
    'bebidas', 'snacks', 'dulces', 'combos', 'helados', 'comida', 'otros'
  ];

  constructor(
    private barService: BarService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar permisos y cargar datos
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para gestionar productos del bar');
      this.router.navigate(['/home']);
      return;
    }

    this.cargarProductos();
    this.suscribirQueryParams();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // ==================== MANEJO DE IMAGEN ====================

  onImageError(event: any): void {
    this.imageError = true;
    this.imageLoaded = false;
  }

  onImageLoad(event: any): void {
    this.imageError = false;
    this.imageLoaded = true;
  }

  setExampleImage(url: string): void {
    this.productoForm.imagen = url;
    this.imageError = false;
    this.imageLoaded = false;
  }

  // ==================== INICIALIZACIÓN ====================

  private suscribirQueryParams(): void {
    const sub = this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        setTimeout(() => {
          this.mostrarFormularioAgregar();
          this.toastService.showSuccess('Formulario de agregar producto activado');
        }, 800);
      }
    });
    this.subscriptions.add(sub);
  }

  private cargarProductos(): void {
    this.cargando = true;
    
    const sub = this.barService.getProductosObservable().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.aplicarFiltros();
        this.calcularEstadisticas();
        this.cargando = false;
        console.log('Productos del bar cargados:', this.productos.length);
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.toastService.showError('Error al cargar los productos del bar');
        this.cargando = false;
        
        // Fallback a datos locales si falla la API
        this.productos = this.barService.getProductos();
        this.aplicarFiltros();
        this.calcularEstadisticas();
      }
    });
    
    this.subscriptions.add(sub);
  }

  // ==================== GESTIÓN DE VISTA ====================

  cambiarVista(vista: 'lista' | 'agregar' | 'editar'): void {
    this.vistaActual = vista;
    
    if (vista === 'lista') {
      this.resetearFormulario();
      this.router.navigate(['/admin/bar']);
    }
  }

  mostrarFormularioAgregar(): void {
    this.resetearFormulario();
    this.vistaActual = 'agregar';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  mostrarFormularioEditar(producto: ProductoBar): void {
    // Convertir ProductoBar a ProductoCreateRequest
    this.productoForm = {
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      categoria: producto.categoria,
      imagen: producto.imagen || undefined,
      disponible: producto.disponible,
      es_combo: producto.es_combo,
      descuento: producto.descuento,
      tamanos: producto.tamanos?.map(t => ({ nombre: t.nombre, precio: t.precio })) || [],
      extras: producto.extras?.map(e => ({ nombre: e.nombre, precio: e.precio })) || [],
      combo_items: producto.combo_items?.map(c => ({ item_nombre: c.item_nombre })) || []
    };
    
    this.productoEditandoId = producto.id;
    this.vistaActual = 'editar';
    this.erroresValidacion = [];
    this.resetearEstadosImagen();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('Editando producto:', producto.nombre);
  }

  // ==================== CRUD DE PRODUCTOS ====================

  async guardarProducto(): Promise<void> {
    const validacion = this.barService.validateProductoData(this.productoForm as ProductoBar);
    
    if (!validacion.valid) {
      this.erroresValidacion = validacion.errors;
      this.toastService.showError('Por favor corrige los errores en el formulario');
      return;
    }

    this.procesando = true;
    this.erroresValidacion = [];

    try {
      const esAgregar = this.vistaActual === 'agregar';
      
      if (esAgregar) {
        // Crear nuevo producto
        const sub = this.barService.addProducto(this.productoForm as ProductoCreateRequest).subscribe({
          next: (resultado) => {
            if (resultado) {
              this.toastService.showSuccess('Producto agregado exitosamente');
              this.cargarProductos();
              this.vistaActual = 'lista';
              this.router.navigate(['/admin/bar']);
            }
            this.procesando = false;
          },
          error: (error) => {
            console.error('Error al crear producto:', error);
            this.toastService.showError('Error al crear el producto');
            this.procesando = false;
          }
        });
        this.subscriptions.add(sub);
        
      } else {
        // Actualizar producto existente
        const resultado = this.barService.updateProducto(this.productoEditandoId, this.productoForm);
        
        if (resultado) {
          this.toastService.showSuccess('Producto actualizado exitosamente');
          this.cargarProductos();
          this.vistaActual = 'lista';
        } else {
          this.toastService.showError('Error al actualizar el producto');
        }
        this.procesando = false;
      }
      
    } catch (error) {
      console.error('Error al guardar producto:', error);
      this.toastService.showError('Error inesperado al guardar el producto');
      this.procesando = false;
    }
  }

  confirmarEliminarProducto(producto: ProductoBar): void {
    this.productoParaEliminar = producto.id;
    this.mostrarModalConfirmacion = true;
  }

  async eliminarProducto(): Promise<void> {
    if (this.productoParaEliminar <= 0) return;
    
    this.procesando = true;
    
    try {
      await this.delay(1000);
      
      const resultado = this.barService.deleteProducto(this.productoParaEliminar);
      
      if (resultado) {
        this.toastService.showSuccess('Producto eliminado exitosamente');
        this.cargarProductos();
      } else {
        this.toastService.showError('Error al eliminar el producto');
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      this.toastService.showError('Error inesperado al eliminar el producto');
    } finally {
      this.cerrarModalConfirmacion();
      this.procesando = false;
    }
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.productoParaEliminar = -1;
  }

  toggleDisponibilidad(producto: ProductoBar): void {
    const exito = this.barService.toggleDisponibilidad(producto.id);
    
    if (exito) {
      const estado = producto.disponible ? 'habilitado' : 'deshabilitado';
      this.toastService.showSuccess(`Producto ${estado} exitosamente`);
      
      // Recargar productos para reflejar cambios
      setTimeout(() => this.cargarProductos(), 500);
    } else {
      this.toastService.showError('Error al cambiar disponibilidad del producto');
    }
  }

  // ==================== FILTROS Y BÚSQUEDA ====================

  aplicarFiltros(): void {
    this.productosFiltrados = this.productos.filter(producto => {
      const cumpleBusqueda = this.cumpleFiltroTexto(producto);
      const cumpleCategoria = this.cumpleFiltroCategoria(producto);
      const cumpleDisponibilidad = this.cumpleFiltroDisponibilidad(producto);
      
      return cumpleBusqueda && cumpleCategoria && cumpleDisponibilidad;
    });

    this.calcularPaginacion();
  }

  private cumpleFiltroTexto(producto: ProductoBar): boolean {
    if (!this.terminoBusqueda.trim()) return true;
    
    const termino = this.terminoBusqueda.toLowerCase();
    return [producto.nombre, producto.descripcion, producto.categoria]
      .some(campo => campo.toLowerCase().includes(termino));
  }

  private cumpleFiltroCategoria(producto: ProductoBar): boolean {
    return !this.filtroCategoria || producto.categoria.toLowerCase() === this.filtroCategoria.toLowerCase();
  }

  private cumpleFiltroDisponibilidad(producto: ProductoBar): boolean {
    return this.filtroDisponibilidad === '' || 
           producto.disponible === (this.filtroDisponibilidad === 'true');
  }

  limpiarFiltros(): void {
    Object.assign(this, {
      terminoBusqueda: '',
      filtroCategoria: '',
      filtroDisponibilidad: '',
      paginaActual: 1
    });
    
    this.aplicarFiltros();
    this.toastService.showInfo('Filtros limpiados');
  }

  // ==================== PAGINACIÓN ====================

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
    this.paginaActual = Math.min(this.paginaActual, Math.max(1, this.totalPaginas));
  }

  getProductosPaginaActual(): ProductoBar[] {
    const inicio = (this.paginaActual - 1) * this.productosPorPagina;
    return this.productosFiltrados.slice(inicio, inicio + this.productosPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  getPaginasArray(): number[] {
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 2);
    
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  }

  // ==================== ESTADÍSTICAS ====================

  private calcularEstadisticas(): void {
    const stats = this.productos.reduce((acc, producto) => {
      acc.total++;
      if (producto.disponible) acc.disponibles++;
      else acc.noDisponibles++;
      if (producto.es_combo) acc.combos++;
      
      acc.porCategoria[producto.categoria] = (acc.porCategoria[producto.categoria] || 0) + 1;
      
      return acc;
    }, {
      total: 0,
      disponibles: 0,
      noDisponibles: 0,
      combos: 0,
      porCategoria: {} as { [key: string]: number }
    });

    this.estadisticas = stats;
  }

  // ==================== UTILIDADES ====================

  private resetearFormulario(): void {
    this.productoForm = {
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: '',
      imagen: '',
      disponible: true,
      es_combo: false,
      tamanos: [],
      extras: [],
      combo_items: []
    };
    this.productoEditandoId = -1;
    this.erroresValidacion = [];
    this.resetearEstadosImagen();
  }

  private resetearEstadosImagen(): void {
    this.imageError = false;
    this.imageLoaded = false;
  }

  getRangoElementos(): string {
    if (!this.productosFiltrados.length) return '0-0 de 0';
    
    const inicio = (this.paginaActual - 1) * this.productosPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.productosPorPagina, this.productosFiltrados.length);
    
    return `${inicio}-${fin} de ${this.productosFiltrados.length}`;
  }

  getCategoriaClass(categoria: string): string {
    const clases: Record<string, string> = {
      'bebidas': 'bg-primary',
      'snacks': 'bg-warning',
      'dulces': 'bg-info',
      'combos': 'bg-danger',
      'helados': 'bg-success',
      'comida': 'bg-secondary'
    };
    
    return clases[categoria.toLowerCase()] || 'bg-secondary';
  }

  formatearPrecio(precio: number): string {
    return `${precio.toFixed(2)}`;
  }

  exportarProductos(): void {
    try {
      const datosExportar = {
        fechaExportacion: new Date().toISOString(),
        totalProductos: this.productos.length,
        estadisticas: this.estadisticas,
        productos: this.productos.map(({ id, nombre, categoria, precio, disponible, es_combo }) => ({
          id, nombre, categoria, precio, disponible, es_combo
        }))
      };
      
      this.descargarJSON(datosExportar, `productos-bar-export-${this.getFechaHoy()}.json`);
      this.toastService.showSuccess('Lista de productos exportada');
      
    } catch (error) {
      console.error('Error al exportar:', error);
      this.toastService.showError('Error al exportar la lista');
    }
  }

  // ==================== GESTIÓN DE ARRAYS DINÁMICOS ====================

  agregarTamano(): void {
    if (!this.productoForm.tamanos) {
      this.productoForm.tamanos = [];
    }
    this.productoForm.tamanos.push({ nombre: '', precio: 0 });
  }

  removerTamano(index: number): void {
    this.productoForm.tamanos?.splice(index, 1);
  }

  agregarExtra(): void {
    if (!this.productoForm.extras) {
      this.productoForm.extras = [];
    }
    this.productoForm.extras.push({ nombre: '', precio: 0 });
  }

  removerExtra(index: number): void {
    this.productoForm.extras?.splice(index, 1);
  }

  agregarItemCombo(): void {
    if (!this.productoForm.combo_items) {
      this.productoForm.combo_items = [];
    }
    this.productoForm.combo_items.push({ item_nombre: '' });
  }

  removerItemCombo(index: number): void {
    this.productoForm.combo_items?.splice(index, 1);
  }

  trackProductoFn(index: number, producto: ProductoBar): number {
    return producto.id;
  }

  // ==================== MÉTODOS AUXILIARES PRIVADOS ====================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private descargarJSON(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    Object.assign(link, { href: url, download: filename });
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private getFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }
}