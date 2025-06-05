import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductoBar, TamañoProducto, ExtraProducto, BarService } from '../../services/bar.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-bar-detail',
  standalone: false,
  templateUrl: './bar-detail.component.html',
  styleUrl: './bar-detail.component.css'
})
export class BarDetailComponent implements OnInit {

  producto: ProductoBar | null = null;
  productoId: number = -1;

  // Estados para edición (admin)
  productoEditando: ProductoBar | null = null;
  guardandoEdicion: boolean = false;
  errorEdicion: string = '';
  exitoEdicion: string = '';

  // Estados para personalización del producto
  tamanoSeleccionado: TamañoProducto | null = null;
  extrasSeleccionados: ExtraProducto[] = [];
  cantidad: number = 1;
  notasEspeciales: string = '';

  // Estados del componente
  cargando: boolean = false;
  agregandoAlCarrito: boolean = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private barService: BarService,
    private router: Router,
    public authService: AuthService,
    private toastService: ToastService,
    private cartService: CartService
  ) {
    this.activatedRoute.params.subscribe(params => {
      this.productoId = +params['id'];
      this.cargarProducto();
    });
  }

  ngOnInit(): void {
    // La carga se maneja en el constructor a través de los params
  }

  // ==================== MÉTODOS DE CARGA ====================

  /**
   * Cargar producto desde el servicio
   */
  private cargarProducto(): void {
    this.cargando = true;
    
    this.producto = this.barService.getProducto(this.productoId);
    
    if (!this.producto) {
      this.toastService.showError('Producto no encontrado');
      this.router.navigate(['/bar']);
      return;
    }

    // Inicializar selecciones
    this.inicializarSelecciones();
    
    this.cargando = false;
    console.log('Producto cargado:', this.producto);
  }

  /**
   * Inicializar selecciones de tamaño y extras
   */
  private inicializarSelecciones(): void {
    if (!this.producto) return;

    // Seleccionar primer tamaño por defecto
    if (this.producto.tamanos && this.producto.tamanos.length > 0) {
      this.tamanoSeleccionado = this.producto.tamanos[0];
    }

    // Limpiar extras seleccionados
    this.extrasSeleccionados = [];
    this.cantidad = 1;
    this.notasEspeciales = '';
  }

  // ==================== MÉTODOS DE PERSONALIZACIÓN ====================

  /**
   * Seleccionar tamaño
   */
  seleccionarTamano(tamano: TamañoProducto): void {
    this.tamanoSeleccionado = tamano;
  }

  /**
   * Toggle extra seleccionado
   */
  toggleExtra(extra: ExtraProducto): void {
    const index = this.extrasSeleccionados.findIndex(e => e.nombre === extra.nombre);
    
    if (index >= 0) {
      // Remover extra
      this.extrasSeleccionados.splice(index, 1);
    } else {
      // Agregar extra
      this.extrasSeleccionados.push(extra);
    }
  }

  /**
   * Verificar si un extra está seleccionado
   */
  estaExtraSeleccionado(extra: ExtraProducto): boolean {
    return this.extrasSeleccionados.some(e => e.nombre === extra.nombre);
  }

  /**
   * Cambiar cantidad
   */
  cambiarCantidad(incremento: number): void {
    const nuevaCantidad = this.cantidad + incremento;
    
    if (nuevaCantidad >= 1 && nuevaCantidad <= 10) {
      this.cantidad = nuevaCantidad;
    }
  }

  // ==================== MÉTODOS DE PRECIOS ====================

  /**
   * Calcular precio base del producto
   */
  getPrecioBase(): number {
    if (!this.producto) return 0;

    // Si hay tamaño seleccionado, usar su precio
    if (this.tamanoSeleccionado) {
      return this.tamanoSeleccionado.precio;
    }

    // Si es combo, aplicar descuento
    if (this.producto.esCombo && this.producto.descuento) {
      return this.producto.precio - this.producto.descuento;
    }

    return this.producto.precio;
  }

  /**
   * Calcular precio de extras
   */
  getPrecioExtras(): number {
    return this.extrasSeleccionados.reduce((total, extra) => total + extra.precio, 0);
  }

  /**
   * Calcular precio total por unidad
   */
  getPrecioPorUnidad(): number {
    return this.getPrecioBase() + this.getPrecioExtras();
  }

  /**
   * Calcular precio total
   */
  getPrecioTotal(): number {
    return this.getPrecioPorUnidad() * this.cantidad;
  }

  /**
   * Verificar si tiene descuento
   */
  tieneDescuento(): boolean {
    return !!(this.producto?.esCombo && this.producto?.descuento);
  }

  /**
   * Obtener precio original (sin descuento)
   */
  getPrecioOriginal(): number {
    return this.producto?.precio || 0;
  }

  // ==================== MÉTODOS DE CARRITO ====================

  /**
   * Agregar al carrito con opciones seleccionadas
   */
  agregarAlCarrito(): void {
    if (!this.producto) return;

    if (!this.producto.disponible) {
      this.toastService.showWarning('Este producto no está disponible');
      return;
    }

    this.agregandoAlCarrito = true;

    // Crear objeto para el carrito
    const productoCarrito = {
      tipo: 'bar',
      producto: this.producto,
      cantidad: this.cantidad,
      precioTotal: this.getPrecioTotal(),
      opciones: {
        tamano: this.tamanoSeleccionado,
        extras: [...this.extrasSeleccionados],
        notas: this.notasEspeciales.trim()
      }
    };

    const agregado = this.cartService.addToCart(productoCarrito);

    setTimeout(() => {
      this.agregandoAlCarrito = false;

      if (agregado) {
        const mensaje = this.cantidad === 1 
          ? `"${this.producto!.nombre}" agregado al carrito`
          : `${this.cantidad}x "${this.producto!.nombre}" agregados al carrito`;
        
        this.toastService.showSuccess(mensaje);

        // Preguntar si quiere seguir comprando o ir al carrito
        this.mostrarOpcionesPostAgregar();
      } else {
        this.toastService.showError('Error al agregar al carrito');
      }
    }, 500);
  }

  /**
   * Mostrar opciones después de agregar al carrito
   */
  private mostrarOpcionesPostAgregar(): void {
    const continuar = confirm(
      '¡Producto agregado al carrito!\n\n' +
      '¿Qué te gustaría hacer?\n\n' +
      'Aceptar = Ver carrito\n' +
      'Cancelar = Seguir comprando'
    );

    if (continuar) {
      this.irAlCarrito();
    } else {
      // Resetear selecciones para nuevo pedido
      this.inicializarSelecciones();
    }
  }

  /**
   * Ir al carrito
   */
  irAlCarrito(): void {
    this.router.navigate(['/cart']);
  }

  /**
   * Comprar ahora (agregar al carrito e ir al checkout)
   */
  comprarAhora(): void {
    if (!this.producto?.disponible) {
      this.toastService.showWarning('Este producto no está disponible');
      return;
    }

    this.agregandoAlCarrito = true;

    const productoCarrito = {
      tipo: 'bar',
      producto: this.producto,
      cantidad: this.cantidad,
      precioTotal: this.getPrecioTotal(),
      opciones: {
        tamano: this.tamanoSeleccionado,
        extras: [...this.extrasSeleccionados],
        notas: this.notasEspeciales.trim()
      }
    };

    const agregado = this.cartService.addToCart(productoCarrito);

    setTimeout(() => {
      this.agregandoAlCarrito = false;

      if (agregado) {
        this.router.navigate(['/checkout']);
      } else {
        this.toastService.showError('Error al agregar al carrito');
      }
    }, 500);
  }

  // ==================== MÉTODOS DE ADMINISTRACIÓN ====================

  /**
   * Editar producto (solo admin)
   */
  editarProducto(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    if (!this.producto) {
      this.toastService.showError('Producto no encontrado');
      return;
    }

    // Preparar datos para edición
    this.productoEditando = { ...this.producto };
    this.errorEdicion = '';
    this.exitoEdicion = '';
    this.guardandoEdicion = false;

    console.log('Editando producto:', this.productoEditando);
  }

  /**
   * Guardar cambios de edición
   */
  guardarEdicionProducto(formulario: any): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    if (!formulario.valid || !this.productoEditando) {
      this.errorEdicion = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.guardandoEdicion = true;
    this.errorEdicion = '';
    this.exitoEdicion = '';

    // Validar datos
    const validacion = this.barService.validateProductoData(this.productoEditando);
    if (!validacion.valid) {
      this.errorEdicion = validacion.errors.join(', ');
      this.guardandoEdicion = false;
      return;
    }

    // Simular delay de guardado
    setTimeout(() => {
      const exito = this.barService.updateProducto(this.productoId, this.productoEditando!);
      
      if (exito) {
        this.exitoEdicion = `Producto "${this.productoEditando!.nombre}" actualizado exitosamente`;
        this.toastService.showSuccess('Producto actualizado exitosamente');
        
        // Recargar datos del producto
        this.recargarProducto();
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          this.cerrarModalEdicion();
          this.resetearEdicion();
        }, 2000);
        
      } else {
        this.errorEdicion = 'Error al actualizar el producto. Por favor intenta de nuevo.';
        this.toastService.showError('Error al actualizar el producto');
      }
      
      this.guardandoEdicion = false;
    }, 1500);
  }

  /**
   * Confirmar eliminación de producto
   */
  confirmarEliminarProducto(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    if (!this.producto) {
      this.toastService.showError('Producto no encontrado');
      return;
    }

    const confirmar = confirm(
      `¿Estás seguro de que quieres eliminar "${this.producto.nombre}"?\n\n` +
      `Esta acción no se puede deshacer.\n` +
      `Serás redirigido a la lista de productos.`
    );

    if (confirmar) {
      this.eliminarProducto();
    }
  }

  /**
   * Eliminar producto
   */
  private eliminarProducto(): void {
    const nombreProducto = this.producto!.nombre;
    
    const exito = this.barService.deleteProducto(this.productoId);
    
    if (exito) {
      this.toastService.showSuccess(`Producto "${nombreProducto}" eliminado exitosamente`);
      
      // Redirigir a la lista de productos después de eliminar
      setTimeout(() => {
        this.router.navigate(['/bar']);
      }, 1500);
      
    } else {
      this.toastService.showError('Error al eliminar el producto');
    }
  }

  /**
   * Cambiar disponibilidad
   */
  toggleDisponibilidad(): void {
    if (!this.authService.isAdmin()) {
      this.toastService.showError('No tienes permisos para realizar esta acción');
      return;
    }

    if (!this.producto) return;

    const exito = this.barService.toggleDisponibilidad(this.producto.id);
    
    if (exito) {
      const estado = this.producto.disponible ? 'deshabilitado' : 'habilitado';
      this.toastService.showSuccess(`Producto ${estado} exitosamente`);
      
      // Recargar producto
      this.recargarProducto();
    } else {
      this.toastService.showError('Error al cambiar disponibilidad');
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Recargar datos del producto desde el servicio
   */
  private recargarProducto(): void {
    this.producto = this.barService.getProducto(this.productoId);
  }

  /**
   * Resetear datos de edición
   */
  private resetearEdicion(): void {
    this.productoEditando = null;
    this.errorEdicion = '';
    this.exitoEdicion = '';
    this.guardandoEdicion = false;
  }

  /**
   * Cerrar modal de edición programáticamente
   */
  private cerrarModalEdicion(): void {
    const modalElement = document.getElementById('modalEditarProducto');
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  }

  /**
   * Volver a la lista de productos
   */
  volverALista(): void {
    this.router.navigate(['/bar']);
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

  /**
   * Verificar si el formulario de personalización es válido
   */
  esFormularioValido(): boolean {
    if (!this.producto) return false;

    // Si el producto tiene tamaños, debe haber uno seleccionado
    if (this.producto.tamanos && this.producto.tamanos.length > 0 && !this.tamanoSeleccionado) {
      return false;
    }

    // La cantidad debe ser válida
    if (this.cantidad < 1 || this.cantidad > 10) {
      return false;
    }

    return true;
  }

  /**
   * Obtener resumen de selecciones
   */
  getResumenSelecciones(): string {
    let resumen = '';

    if (this.tamanoSeleccionado) {
      resumen += `Tamaño: ${this.tamanoSeleccionado.nombre}`;
    }

    if (this.extrasSeleccionados.length > 0) {
      if (resumen) resumen += '\n';
      resumen += `Extras: ${this.extrasSeleccionados.map(e => e.nombre).join(', ')}`;
    }

    if (this.notasEspeciales.trim()) {
      if (resumen) resumen += '\n';
      resumen += `Notas: ${this.notasEspeciales.trim()}`;
    }

    return resumen;
  }

  /**
   * 🔧 NUEVO: Obtener resumen formateado para HTML
   */
  getResumenSeleccionesHTML(): string {
    const resumen = this.getResumenSelecciones();
    return resumen.replace(/\n/g, '<br>');
  }
}