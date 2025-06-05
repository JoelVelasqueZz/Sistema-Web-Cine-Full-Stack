import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductoBar, BarService } from '../../services/bar.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-bar-list',
  standalone: false,
  templateUrl: './bar-list.component.html',
  styleUrl: './bar-list.component.css'
})
export class BarListComponent implements OnInit {

  productos: ProductoBar[] = [];
  productosOriginales: ProductoBar[] = [];
  productosFiltrados: ProductoBar[] = [];
  filtroActivo: string = 'ninguno';
  
  categoriaSeleccionada: string = 'Todas';
  categoriasDisponibles: string[] = [];

  // Estados del componente
  cargando: boolean = false;
  mostrandoSoloDisponibles: boolean = true;

  constructor(
    private barService: BarService,
    private router: Router,
    private route: ActivatedRoute,
    public authService: AuthService,
    private toastService: ToastService,
    public cartService: CartService // 🔧 Hacer público para usar en template
  ) {}

  ngOnInit(): void {
    this.cargando = true;
    
    // Cargar productos
    this.productosOriginales = this.barService.getProductos();
    this.productos = [...this.productosOriginales];
    this.productosFiltrados = [...this.productos];
    
    // Cargar categorías
    this.categoriasDisponibles = this.barService.getCategorias();
    
    // Verificar parámetros URL
    this.verificarParametrosURL();
    
    // Aplicar filtro de disponibles por defecto
    this.aplicarFiltroDisponibles();
    
    this.cargando = false;
    
    console.log('Productos del bar cargados:', this.productos.length);
  }

  // ==================== MÉTODOS DE FILTRADO ====================

  /**
   * Filtrar por categoría
   */
  filtrarPorCategoria(categoria: string): void {
    this.categoriaSeleccionada = categoria;
    this.aplicarFiltrosCombinados();
  }

  /**
   * Aplicar todos los filtros combinados
   */
  private aplicarFiltrosCombinados(): void {
    let productosBase: ProductoBar[];

    // Filtro base por categoría
    if (this.categoriaSeleccionada === 'Todas') {
      productosBase = [...this.productosOriginales];
    } else {
      productosBase = this.barService.getProductosPorCategoria(this.categoriaSeleccionada);
    }

    // Filtro por disponibilidad
    if (this.mostrandoSoloDisponibles) {
      productosBase = productosBase.filter(producto => producto.disponible);
    }

    // Aplicar filtros de ordenamiento
    switch (this.filtroActivo) {
      case 'precio-menor':
        this.productos = productosBase.sort((a, b) => a.precio - b.precio);
        break;
      case 'precio-mayor':
        this.productos = productosBase.sort((a, b) => b.precio - a.precio);
        break;
      case 'alfabetico':
        this.productos = productosBase.sort((a, b) => 
          a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' })
        );
        break;
      case 'categoria':
        this.productos = productosBase.sort((a, b) => 
          a.categoria.localeCompare(b.categoria, 'es', { sensitivity: 'base' })
        );
        break;
      case 'combos':
        this.productos = productosBase.sort((a, b) => {
          if (a.esCombo && !b.esCombo) return -1;
          if (!a.esCombo && b.esCombo) return 1;
          return 0;
        });
        break;
      default:
        this.productos = productosBase;
    }
    
    this.productosFiltrados = [...this.productos];
  }

  /**
   * Aplicar filtro de ordenamiento
   */
  aplicarFiltro(tipoFiltro: string): void {
    this.filtroActivo = tipoFiltro;
    this.aplicarFiltrosCombinados();
  }

  /**
   * Aplicar filtro de solo disponibles
   */
  aplicarFiltroDisponibles(): void {
    this.mostrandoSoloDisponibles = !this.mostrandoSoloDisponibles;
    this.aplicarFiltrosCombinados();
  }

  /**
   * Limpiar todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroActivo = 'ninguno';
    this.categoriaSeleccionada = 'Todas';
    this.mostrandoSoloDisponibles = true;
    this.productos = [...this.productosOriginales];
    this.aplicarFiltroDisponibles();
  }

  /**
   * Verificar si hay filtros activos
   */
  hayFiltrosActivos(): boolean {
    return this.filtroActivo !== 'ninguno' || 
           this.categoriaSeleccionada !== 'Todas' || 
           !this.mostrandoSoloDisponibles;
  }

  // ==================== MÉTODOS DE NAVEGACIÓN ====================

  /**
   * Ver detalles de un producto
   */
  verProducto(productoId: number): void {
    this.router.navigate(['/bar', productoId]);
  }

  /**
   * Verificar parámetros URL
   */
  verificarParametrosURL(): void {
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.filtrarPorCategoria(params['category']);
      }
    });
  }

  // ==================== MÉTODOS DE CARRITO ====================

  /**
   * Agregar producto básico al carrito (sin opciones)
   */
  agregarAlCarrito(producto: ProductoBar, event: Event): void {
    event.stopPropagation(); // Evitar navegación

    if (!producto.disponible) {
      this.toastService.showWarning('Este producto no está disponible');
      return;
    }

    // Si el producto tiene opciones, ir a detalles
    if (this.barService.tieneOpciones(producto)) {
      this.toastService.showInfo('Este producto tiene opciones. Ve a detalles para personalizarlo.');
      this.verProducto(producto.id);
      return;
    }

    // Agregar producto simple al carrito
    const productoCarrito = {
      tipo: 'bar',
      producto: producto,
      cantidad: 1,
      precioTotal: producto.precio,
      opciones: {}
    };

    const agregado = this.cartService.addToCart(productoCarrito);
    
    if (agregado) {
      this.toastService.showSuccess(`"${producto.nombre}" agregado al carrito`);
    } else {
      this.toastService.showError('Error al agregar al carrito');
    }
  }

  /**
   * Agregar combo al carrito (ir a detalles para configurar)
   */
  agregarComboAlCarrito(producto: ProductoBar, event: Event): void {
    event.stopPropagation();

    if (!producto.disponible) {
      this.toastService.showWarning('Este combo no está disponible');
      return;
    }

    this.toastService.showInfo('Configura tu combo en la página de detalles');
    this.verProducto(producto.id);
  }

  // ==================== MÉTODOS DE ADMINISTRACIÓN ====================

  /**
   * Cambiar disponibilidad de producto (solo admin)
   */
  toggleDisponibilidad(producto: ProductoBar, event: Event): void {
    event.stopPropagation();

    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    const exito = this.barService.toggleDisponibilidad(producto.id);
    
    if (exito) {
      const estado = producto.disponible ? 'habilitado' : 'deshabilitado';
      this.toastService.showSuccess(`Producto ${estado} exitosamente`);
      
      // Actualizar la vista
      this.aplicarFiltrosCombinados();
    } else {
      this.toastService.showError('Error al cambiar disponibilidad del producto');
    }
  }

  /**
   * Editar producto (solo admin)
   */
  editarProducto(producto: ProductoBar, event: Event): void {
    event.stopPropagation();

    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    // Redirigir a admin con el ID del producto
    this.router.navigate(['/admin/bar', producto.id]);
  }

  /**
   * Eliminar producto (solo admin)
   */
  eliminarProducto(producto: ProductoBar, event: Event): void {
    event.stopPropagation();

    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    const confirmar = confirm(
      `¿Estás seguro de que quieres eliminar "${producto.nombre}"?\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (confirmar) {
      const exito = this.barService.deleteProducto(producto.id);
      
      if (exito) {
        this.toastService.showSuccess(`"${producto.nombre}" eliminado exitosamente`);
        
        // Recargar productos
        this.recargarProductos();
      } else {
        this.toastService.showError('Error al eliminar el producto');
      }
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Recargar productos desde el servicio
   */
  private recargarProductos(): void {
    this.productosOriginales = this.barService.getProductos();
    this.aplicarFiltrosCombinados();
  }

  /**
   * Contar productos por categoría
   */
  contarProductosPorCategoria(categoria: string): number {
    return this.barService.contarProductosPorCategoria(categoria);
  }

  /**
   * Obtener nombre de la categoría actual
   */
  getNombreCategoria(): string {
    return this.categoriaSeleccionada;
  }

  /**
   * Obtener nombre del filtro actual
   */
  getNombreFiltro(): string {
    switch (this.filtroActivo) {
      case 'precio-menor': return 'Precio: Menor a Mayor';
      case 'precio-mayor': return 'Precio: Mayor a Menor';
      case 'alfabetico': return 'Orden Alfabético';
      case 'categoria': return 'Por Categoría';
      case 'combos': return 'Combos Primero';
      default: return 'Sin filtro';
    }
  }

  /**
   * Verificar si es un combo
   */
  esCombo(producto: ProductoBar): boolean {
    return producto.esCombo;
  }

  /**
   * Calcular precio con descuento
   */
  getPrecioConDescuento(producto: ProductoBar): number {
    return this.barService.calcularPrecioConDescuento(producto);
  }

  /**
   * 🔧 NUEVO: Obtener precio original (sin descuento)
   */
  getPrecioOriginal(producto: ProductoBar): number {
    return producto.precio;
  }

  /**
   * Verificar si el producto tiene descuento
   */
  tieneDescuento(producto: ProductoBar): boolean {
    return producto.esCombo && !!producto.descuento;
  }

  /**
   * Verificar si el producto tiene opciones
   */
  tieneOpciones(producto: ProductoBar): boolean {
    return this.barService.tieneOpciones(producto);
  }

  /**
   * 🔧 NUEVO: Verificar si el producto tiene tamaños
   */
  tieneTamanos(producto: ProductoBar): boolean {
    return !!(producto.tamanos && producto.tamanos.length > 0);
  }

  /**
   * 🔧 NUEVO: Verificar si el producto tiene extras
   */
  tieneExtras(producto: ProductoBar): boolean {
    return !!(producto.extras && producto.extras.length > 0);
  }

  /**
   * Verificar si está en el carrito
   */
  estaEnCarrito(producto: ProductoBar): boolean {
    return this.cartService.isInCart('bar', producto.id);
  }

  /**
   * Obtener cantidad en carrito
   */
  getCantidadEnCarrito(producto: ProductoBar): number {
    return this.cartService.getItemQuantity('bar', producto.id);
  }

  /**
   * Ir al carrito
   */
  irAlCarrito(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Scroll hacia arriba
   */
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Ir a administración del bar
   */
  irAAdminBar(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para acceder a esta sección');
      return;
    }

    this.router.navigate(['/admin/bar']);
  }
}