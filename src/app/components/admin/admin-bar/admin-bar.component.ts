// src/app/components/admin/admin-bar/admin-bar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; // 🔥 AGREGAR ActivatedRoute
import { ProductoBar, BarService } from '../../../services/bar.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { Subscription } from 'rxjs'; // 🔥 AGREGAR Subscription

@Component({
  selector: 'app-admin-bar',
  standalone: false,
  templateUrl: './admin-bar.component.html',
  styleUrl: './admin-bar.component.css'
})
export class AdminBarComponent implements OnInit, OnDestroy {

  imageLoaded: boolean = false;
  imageError: boolean = false;

  productos: ProductoBar[] = [];
  productosFiltrados: ProductoBar[] = [];
  
  // Estados de vista
  vistaActual: 'lista' | 'agregar' | 'editar' = 'lista';
  cargando: boolean = true;
  procesando: boolean = false;
  
  // Formulario de producto
  productoForm: Partial<ProductoBar> = {};
  productoEditandoId: number = -1;
  erroresValidacion: string[] = [];
  
  // Filtros y búsqueda
  filtroCategoria: string = '';
  filtroDisponibilidad: string = '';
  terminoBusqueda: string = '';
  
  // Paginación
  paginaActual: number = 1;
  productosPorPagina: number = 10;
  totalPaginas: number = 1;
  
  // Modal de confirmación
  mostrarModalConfirmacion: boolean = false;
  productoParaEliminar: number = -1;
  
  // 🔥 AGREGAR: Subscription para query params
  private routeSubscription: Subscription = new Subscription();
  
  // Estadísticas
  estadisticas = {
    total: 0,
    disponibles: 0,
    noDisponibles: 0,
    combos: 0,
    porCategoria: {} as { [key: string]: number }
  };
  
  // Categorías disponibles
  categoriasDisponibles: string[] = [
    'Bebidas', 'Snacks', 'Dulces', 'Combos', 'Helados'
  ];

  constructor(
    private barService: BarService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute // 🔥 AGREGAR ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Verificar permisos de admin
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para gestionar productos del bar');
      this.router.navigate(['/home']);
      return;
    }

    // Cargar datos iniciales
    this.cargarProductos();
    
    // 🔥 AGREGAR: Verificar si viene con acción de agregar
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        // Esperar un poco a que se carguen los datos
        setTimeout(() => {
          this.mostrarFormularioAgregar();
          this.toastService.showSuccess('Formulario de agregar producto activado');
        }, 800);
      }
    });
    
    console.log('Admin Bar inicializado');
  }
  
  onImageError(event: any): void {
    this.imageError = true;
    this.imageLoaded = false;
    console.log('Error al cargar imagen:', event);
  }

  /**
   * Manejar carga exitosa de imagen
   */
  onImageLoad(event: any): void {
    this.imageError = false;
    this.imageLoaded = true;
    console.log('Imagen cargada exitosamente');
  }

  /**
   * Establecer ejemplo de imagen
   */
  setExampleImage(url: string): void {
    this.productoForm.imagen = url;
    this.imageError = false;
    this.imageLoaded = false;
  }
  
  ngOnDestroy(): void {
    // 🔥 ACTUALIZAR: Cleanup de subscriptions
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  // ==================== CARGA DE DATOS ====================

  /**
   * Cargar todos los productos del bar
   */
  cargarProductos(): void {
    this.cargando = true;
    
    try {
      this.productos = this.barService.getProductos();
      this.aplicarFiltros();
      this.calcularEstadisticas();
      this.cargando = false;
      
      console.log('Productos del bar cargados:', this.productos.length);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      this.toastService.showError('Error al cargar los productos del bar');
      this.cargando = false;
    }
  }

  // ==================== GESTIÓN DE VISTA ====================

  /**
   * Cambiar vista actual
   */
  cambiarVista(vista: 'lista' | 'agregar' | 'editar'): void {
    this.vistaActual = vista;
    
    if (vista === 'lista') {
      this.resetearFormulario();
      // 🔥 AGREGAR: Limpiar query params al volver a lista
      this.router.navigate(['/admin/bar']);
    }
  }

  /**
   * Mostrar formulario para agregar producto
   */
  mostrarFormularioAgregar(): void {
    this.resetearFormulario();
    this.vistaActual = 'agregar';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Mostrar formulario para editar producto
   */
  mostrarFormularioEditar(producto: ProductoBar): void {
    this.productoForm = { ...producto };
    this.productoEditandoId = producto.id;
    this.vistaActual = 'editar';
    this.erroresValidacion = [];
    
    // 🔥 AGREGAR: Resetear estados de imagen para edición
    this.imageError = false;
    this.imageLoaded = false;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('Editando producto:', producto.nombre);
  }

  // ==================== CRUD DE PRODUCTOS ====================

  /**
   * Guardar producto (crear o actualizar)
   */
  guardarProducto(): void {
    // Validar datos
    const validacion = this.barService.validateProductoData(this.productoForm);
    
    if (!validacion.valid) {
      this.erroresValidacion = validacion.errors;
      this.toastService.showError('Por favor corrige los errores en el formulario');
      return;
    }

    this.procesando = true;
    this.erroresValidacion = [];

    // Simular delay de procesamiento
    setTimeout(() => {
      try {
        let resultado: boolean;
        
        if (this.vistaActual === 'agregar') {
          resultado = this.barService.addProducto(this.productoForm as Omit<ProductoBar, 'id'>);
          
          if (resultado) {
            this.toastService.showSuccess('Producto agregado exitosamente');
            this.cargarProductos();
            this.vistaActual = 'lista';
            // 🔥 AGREGAR: Limpiar query params después de agregar
            this.router.navigate(['/admin/bar']);
          } else {
            this.toastService.showError('Error al agregar el producto');
          }
          
        } else if (this.vistaActual === 'editar') {
          resultado = this.barService.updateProducto(this.productoEditandoId, this.productoForm);
          
          if (resultado) {
            this.toastService.showSuccess('Producto actualizado exitosamente');
            this.cargarProductos();
            this.vistaActual = 'lista';
          } else {
            this.toastService.showError('Error al actualizar el producto');
          }
        }
        
        this.procesando = false;
        
      } catch (error) {
        console.error('Error al guardar producto:', error);
        this.toastService.showError('Error inesperado al guardar el producto');
        this.procesando = false;
      }
    }, 1000);
  }

  /**
   * Confirmar eliminación de producto
   */
  confirmarEliminarProducto(producto: ProductoBar): void {
    this.productoParaEliminar = producto.id;
    this.mostrarModalConfirmacion = true;
  }

  /**
   * Eliminar producto confirmado
   */
  eliminarProducto(): void {
    if (this.productoParaEliminar > 0) {
      this.procesando = true;
      
      setTimeout(() => {
        const resultado = this.barService.deleteProducto(this.productoParaEliminar);
        
        if (resultado) {
          this.toastService.showSuccess('Producto eliminado exitosamente');
          this.cargarProductos();
        } else {
          this.toastService.showError('Error al eliminar el producto');
        }
        
        this.cerrarModalConfirmacion();
        this.procesando = false;
      }, 1000);
    }
  }

  /**
   * Cerrar modal de confirmación
   */
  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.productoParaEliminar = -1;
  }

  /**
   * Cambiar disponibilidad de producto
   */
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

  /**
   * Aplicar filtros a la lista de productos
   */
  aplicarFiltros(): void {
    let productosFiltrados = [...this.productos];

    // Filtro por búsqueda de texto
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.nombre.toLowerCase().includes(termino) ||
        producto.descripcion.toLowerCase().includes(termino) ||
        producto.categoria.toLowerCase().includes(termino)
      );
    }

    // Filtro por categoría
    if (this.filtroCategoria) {
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.categoria === this.filtroCategoria
      );
    }

    // Filtro por disponibilidad
    if (this.filtroDisponibilidad !== '') {
      const disponible = this.filtroDisponibilidad === 'true';
      productosFiltrados = productosFiltrados.filter(producto =>
        producto.disponible === disponible
      );
    }

    this.productosFiltrados = productosFiltrados;
    this.calcularPaginacion();
  }

  /**
   * Limpiar todos los filtros
   */
  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroCategoria = '';
    this.filtroDisponibilidad = '';
    this.paginaActual = 1;
    
    this.aplicarFiltros();
    this.toastService.showInfo('Filtros limpiados');
  }

  // ==================== PAGINACIÓN ====================

  /**
   * Calcular paginación
   */
  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
    
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = Math.max(1, this.totalPaginas);
    }
  }

  /**
   * Obtener productos de la página actual
   */
  getProductosPaginaActual(): ProductoBar[] {
    const inicio = (this.paginaActual - 1) * this.productosPorPagina;
    const fin = inicio + this.productosPorPagina;
    return this.productosFiltrados.slice(inicio, fin);
  }

  /**
   * Cambiar página
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  /**
   * Obtener array de páginas para mostrar
   */
  getPaginasArray(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 2);
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Calcular estadísticas de productos
   */
  calcularEstadisticas(): void {
    this.estadisticas.total = this.productos.length;
    this.estadisticas.disponibles = this.productos.filter(p => p.disponible).length;
    this.estadisticas.noDisponibles = this.productos.filter(p => !p.disponible).length;
    this.estadisticas.combos = this.productos.filter(p => p.esCombo).length;
    
    // Estadísticas por categoría
    this.estadisticas.porCategoria = {};
    this.productos.forEach(producto => {
      const categoria = producto.categoria;
      this.estadisticas.porCategoria[categoria] = (this.estadisticas.porCategoria[categoria] || 0) + 1;
    });
  }

  // ==================== UTILIDADES ====================

  /**
   * Resetear formulario
   */
  resetearFormulario(): void {
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
    
    // 🔥 MANTENER: Reset de estados de imagen
    this.imageError = false;
    this.imageLoaded = false;
  }

  /**
   * Obtener información de rango de elementos mostrados
   */
  getRangoElementos(): string {
    const inicio = (this.paginaActual - 1) * this.productosPorPagina + 1;
    const fin = Math.min(this.paginaActual * this.productosPorPagina, this.productosFiltrados.length);
    const total = this.productosFiltrados.length;
    
    return `${inicio}-${fin} de ${total}`;
  }

  /**
   * Obtener clase CSS para categoría
   */
  getCategoriaClass(categoria: string): string {
    const clases: { [key: string]: string } = {
      'Bebidas': 'bg-primary',
      'Snacks': 'bg-warning',
      'Dulces': 'bg-info',
      'Combos': 'bg-danger',
      'Helados': 'bg-success'
    };
    
    return clases[categoria] || 'bg-secondary';
  }

  /**
   * Formatear precio
   */
  formatearPrecio(precio: number): string {
    return `$${precio.toFixed(2)}`;
  }

  /**
   * Exportar lista de productos
   */
  exportarProductos(): void {
    try {
      const datosExportar = {
        fechaExportacion: new Date().toISOString(),
        totalProductos: this.productos.length,
        estadisticas: this.estadisticas,
        productos: this.productos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          categoria: p.categoria,
          precio: p.precio,
          disponible: p.disponible,
          esCombo: p.esCombo
        }))
      };
      
      const blob = new Blob([JSON.stringify(datosExportar, null, 2)], 
        { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `productos-bar-export-${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.toastService.showSuccess('Lista de productos exportada');
      
    } catch (error) {
      console.error('Error al exportar:', error);
      this.toastService.showError('Error al exportar la lista');
    }
  }

  /**
   * Agregar tamaño al producto
   */
  agregarTamano(): void {
    if (!this.productoForm.tamanos) {
      this.productoForm.tamanos = [];
    }
    
    this.productoForm.tamanos.push({
      nombre: '',
      precio: 0
    });
  }

  /**
   * Remover tamaño del producto
   */
  removerTamano(index: number): void {
    if (this.productoForm.tamanos) {
      this.productoForm.tamanos.splice(index, 1);
    }
  }

  /**
   * Agregar extra al producto
   */
  agregarExtra(): void {
    if (!this.productoForm.extras) {
      this.productoForm.extras = [];
    }
    
    this.productoForm.extras.push({
      nombre: '',
      precio: 0
    });
  }

  /**
   * Remover extra del producto
   */
  removerExtra(index: number): void {
    if (this.productoForm.extras) {
      this.productoForm.extras.splice(index, 1);
    }
  }

  /**
   * Agregar item al combo
   */
  agregarItemCombo(): void {
    if (!this.productoForm.incluye) {
      this.productoForm.incluye = [];
    }
    
    this.productoForm.incluye.push('');
  }

  /**
   * Remover item del combo
   */
  removerItemCombo(index: number): void {
    if (this.productoForm.incluye) {
      this.productoForm.incluye.splice(index, 1);
    }
  }

  /**
   * Track function para ngFor optimizado
   */
  trackProductoFn(index: number, producto: ProductoBar): number {
    return producto.id;
  }
}