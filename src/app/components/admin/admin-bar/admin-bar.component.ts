// src/app/components/admin/admin-bar/admin-bar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductoBar, BarService } from '../../../services/bar.service';
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
  productoForm: Partial<ProductoBar> = {};
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
  
  private routeSubscription = new Subscription();
  
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
    'Bebidas', 'Snacks', 'Dulces', 'Combos', 'Helados'
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
    this.routeSubscription?.unsubscribe();
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
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        setTimeout(() => {
          this.mostrarFormularioAgregar();
          this.toastService.showSuccess('Formulario de agregar producto activado');
        }, 800);
      }
    });
  }

  private cargarProductos(): void {
    this.cargando = true;
    
    try {
      this.productos = this.barService.getProductos();
      this.aplicarFiltros();
      this.calcularEstadisticas();
      console.log('Productos del bar cargados:', this.productos.length);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      this.toastService.showError('Error al cargar los productos del bar');
    } finally {
      this.cargando = false;
    }
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
    this.productoForm = { ...producto };
    this.productoEditandoId = producto.id;
    this.vistaActual = 'editar';
    this.erroresValidacion = [];
    this.resetearEstadosImagen();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('Editando producto:', producto.nombre);
  }

  // ==================== CRUD DE PRODUCTOS ====================

  async guardarProducto(): Promise<void> {
    const validacion = this.barService.validateProductoData(this.productoForm);
    
    if (!validacion.valid) {
      this.erroresValidacion = validacion.errors;
      this.toastService.showError('Por favor corrige los errores en el formulario');
      return;
    }

    this.procesando = true;
    this.erroresValidacion = [];

    try {
      await this.delay(1000); // Simular delay de procesamiento
      
      const esAgregar = this.vistaActual === 'agregar';
      const resultado = esAgregar 
        ? this.barService.addProducto(this.productoForm as Omit<ProductoBar, 'id'>)
        : this.barService.updateProducto(this.productoEditandoId, this.productoForm);
      
      if (resultado) {
        const mensaje = esAgregar ? 'Producto agregado exitosamente' : 'Producto actualizado exitosamente';
        this.toastService.showSuccess(mensaje);
        this.cargarProductos();
        this.vistaActual = 'lista';
        
        if (esAgregar) {
          this.router.navigate(['/admin/bar']);
        }
      } else {
        const mensajeError = esAgregar ? 'Error al agregar el producto' : 'Error al actualizar el producto';
        this.toastService.showError(mensajeError);
      }
      
    } catch (error) {
      console.error('Error al guardar producto:', error);
      this.toastService.showError('Error inesperado al guardar el producto');
    } finally {
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
      this.cargarProductos();
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
    return !this.filtroCategoria || producto.categoria === this.filtroCategoria;
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
      if (producto.esCombo) acc.combos++;
      
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
      esCombo: false
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
      'Bebidas': 'bg-primary',
      'Snacks': 'bg-warning',
      'Dulces': 'bg-info',
      'Combos': 'bg-danger',
      'Helados': 'bg-success'
    };
    
    return clases[categoria] || 'bg-secondary';
  }

  formatearPrecio(precio: number): string {
    return `$${precio.toFixed(2)}`;
  }

  exportarProductos(): void {
    try {
      const datosExportar = {
        fechaExportacion: new Date().toISOString(),
        totalProductos: this.productos.length,
        estadisticas: this.estadisticas,
        productos: this.productos.map(({ id, nombre, categoria, precio, disponible, esCombo }) => ({
          id, nombre, categoria, precio, disponible, esCombo
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
    this.productoForm.tamanos ??= [];
    this.productoForm.tamanos.push({ nombre: '', precio: 0 });
  }

  removerTamano(index: number): void {
    this.productoForm.tamanos?.splice(index, 1);
  }

  agregarExtra(): void {
    this.productoForm.extras ??= [];
    this.productoForm.extras.push({ nombre: '', precio: 0 });
  }

  removerExtra(index: number): void {
    this.productoForm.extras?.splice(index, 1);
  }

  agregarItemCombo(): void {
    this.productoForm.incluye ??= [];
    this.productoForm.incluye.push('');
  }

  removerItemCombo(index: number): void {
    this.productoForm.incluye?.splice(index, 1);
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