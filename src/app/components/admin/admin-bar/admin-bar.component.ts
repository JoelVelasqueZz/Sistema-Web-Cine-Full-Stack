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
  productosEliminados: ProductoBar[] = []; // 🆕 NUEVA PROPIEDAD
  
  // Estados de vista
  vistaActual: 'lista' | 'agregar' | 'editar' | 'papelera' = 'lista'; // 🆕 AGREGADA VISTA PAPELERA
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
  tipoEliminacion: 'soft' | 'hard' | 'restore' = 'soft'; // 🆕 NUEVO
  
  private subscriptions = new Subscription();
  
  // Estadísticas
  estadisticas = {
    total: 0,
    disponibles: 0,
    noDisponibles: 0,
    combos: 0,
    eliminados: 0, // 🆕 NUEVA ESTADÍSTICA
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
    this.cargarProductosEliminados(); // 🆕 CARGAR PAPELERA
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

  // 🆕 NUEVO MÉTODO: Cargar productos eliminados
  private cargarProductosEliminados(): void {
    const sub = this.barService.getProductosEliminados().subscribe({
      next: (eliminados) => {
        this.productosEliminados = eliminados;
        this.estadisticas.eliminados = eliminados.length;
        console.log('Productos eliminados cargados:', eliminados.length);
      },
      error: (error) => {
        console.error('Error al cargar productos eliminados:', error);
        this.productosEliminados = [];
      }
    });
    
    this.subscriptions.add(sub);
  }

  // ==================== GESTIÓN DE VISTA ====================

  cambiarVista(vista: 'lista' | 'agregar' | 'editar' | 'papelera'): void {
    this.vistaActual = vista;
    
    if (vista === 'lista') {
      this.resetearFormulario();
      this.router.navigate(['/admin/bar']);
    } else if (vista === 'papelera') {
      this.cargarProductosEliminados(); // Recargar papelera
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
    console.log('🔍 Estado actual del formulario:', this.productoForm);
    
    // Validación mejorada
    const validacion = this.barService.validateProductoData(this.productoForm as ProductoBar);
    
    if (!validacion.valid) {
      console.log('❌ Errores de validación:', validacion.errors);
      this.erroresValidacion = validacion.errors;
      this.toastService.showError('Por favor corrige los errores en el formulario');
      return;
    }

    // Limpiar datos antes de enviar
    const productoParaEnviar = this.limpiarFormularioParaEnvio();
    console.log('📤 Datos que se enviarán:', productoParaEnviar);

    this.procesando = true;
    this.erroresValidacion = [];

    try {
      const esAgregar = this.vistaActual === 'agregar';
      
      if (esAgregar) {
        console.log('➕ Creando nuevo producto...');
        
        const sub = this.barService.addProducto(productoParaEnviar).subscribe({
          next: (resultado) => {
            console.log('✅ Producto creado exitosamente:', resultado);
            if (resultado) {
              this.toastService.showSuccess('Producto agregado exitosamente');
              this.cargarProductos();
              this.vistaActual = 'lista';
              this.router.navigate(['/admin/bar']);
            }
            this.procesando = false;
          },
          error: (error) => {
            console.error('❌ Error completo al crear producto:', error);
            
            let mensajeError = 'Error al crear el producto';
            
            if (error.status === 400) {
              if (error.error && error.error.errors) {
                if (Array.isArray(error.error.errors)) {
                  this.erroresValidacion = error.error.errors.map((err: any) => err.msg || err.message || err);
                } else {
                  this.erroresValidacion = [error.error.errors];
                }
                mensajeError = 'Datos del formulario inválidos';
              } else if (error.error && error.error.message) {
                mensajeError = error.error.message;
              }
            } else if (error.status === 401) {
              mensajeError = 'No tienes permisos para realizar esta acción';
            } else if (error.status === 500) {
              mensajeError = 'Error interno del servidor';
            } else if (error.status === 0) {
              mensajeError = 'No se puede conectar con el servidor';
            }
            
            this.toastService.showError(mensajeError);
            this.procesando = false;
          }
        });
        this.subscriptions.add(sub);
        
      } else {
        // Actualizar producto existente
        console.log('✏️ Actualizando producto existente...');
        const resultado = this.barService.updateProducto(this.productoEditandoId, productoParaEnviar);
        
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
      console.error('❌ Error inesperado:', error);
      this.toastService.showError('Error inesperado al guardar el producto');
      this.procesando = false;
    }
  }

  private limpiarFormularioParaEnvio(): ProductoCreateRequest {
    const form = this.productoForm;
    
    const resultado: any = {
      nombre: (form.nombre || '').trim(),
      descripcion: (form.descripcion || '').trim(),
      precio: Number(form.precio) || 0,
      categoria: (form.categoria || '').trim(),
      disponible: Boolean(form.disponible !== false), // default true
      es_combo: Boolean(form.es_combo)
    };

    // Solo incluir imagen si tiene valor
    if (form.imagen && form.imagen.trim()) {
      resultado.imagen = form.imagen.trim();
    }

    // Solo incluir descuento si es combo y tiene valor
    if (form.es_combo && form.descuento !== undefined && Number(form.descuento) >= 0) {
      resultado.descuento = Number(form.descuento);
    }
    
    // Solo incluir arrays si tienen elementos válidos
    const tamanosLimpios = this.limpiarTamanos(form.tamanos || []);
    if (tamanosLimpios.length > 0) {
      resultado.tamanos = tamanosLimpios;
    }

    const extrasLimpios = this.limpiarExtras(form.extras || []);
    if (extrasLimpios.length > 0) {
      resultado.extras = extrasLimpios;
    }

    const comboItemsLimpios = this.limpiarComboItems(form.combo_items || []);
    if (comboItemsLimpios.length > 0) {
      resultado.combo_items = comboItemsLimpios;
    }

    return resultado;
  }

  private limpiarTamanos(tamanos: any[]): any[] {
    if (!Array.isArray(tamanos)) return [];
    
    return tamanos
      .filter(t => t && t.nombre && t.nombre.trim() && t.precio !== undefined && t.precio >= 0)
      .map(t => ({
        nombre: String(t.nombre).trim(),
        precio: Number(t.precio)
      }));
  }

  private limpiarExtras(extras: any[]): any[] {
    if (!Array.isArray(extras)) return [];
    
    return extras
      .filter(e => e && e.nombre && e.nombre.trim() && e.precio !== undefined && e.precio >= 0)
      .map(e => ({
        nombre: String(e.nombre).trim(),
        precio: Number(e.precio)
      }));
  }

  private limpiarComboItems(comboItems: any[]): any[] {
    if (!Array.isArray(comboItems)) return [];
    
    return comboItems
      .filter(c => c && c.item_nombre && c.item_nombre.trim())
      .map(c => ({
        item_nombre: String(c.item_nombre).trim()
      }));
  }

  // 🆕 MODIFICADO: Confirmar eliminación con diferentes tipos
  confirmarEliminarProducto(producto: ProductoBar, tipo: 'soft' | 'hard' = 'soft'): void {
    this.productoParaEliminar = producto.id;
    this.tipoEliminacion = tipo;
    this.mostrarModalConfirmacion = true;
  }

  // 🆕 NUEVO: Confirmar restauración
  confirmarRestaurarProducto(producto: ProductoBar): void {
    this.productoParaEliminar = producto.id;
    this.tipoEliminacion = 'restore';
    this.mostrarModalConfirmacion = true;
  }

  // 🆕 MODIFICADO: Eliminar con diferentes tipos
 async eliminarProducto(): Promise<void> {
  if (this.productoParaEliminar <= 0) return;
  
  this.procesando = true;
  
  try {
    await this.delay(1000);
    
    let resultado = false;
    
    switch (this.tipoEliminacion) {
      case 'soft':
        resultado = this.barService.deleteProducto(this.productoParaEliminar);
        if (resultado) {
          // 🔧 FIX: Remover del array local inmediatamente
          const nombreProducto = this.productos.find(p => p.id === this.productoParaEliminar)?.nombre || 'Producto';
          
          // Filtrar el producto eliminado de la lista actual
          this.productos = this.productos.filter(p => p.id !== this.productoParaEliminar);
          this.aplicarFiltros(); // Reaplicar filtros
          this.calcularEstadisticas(); // Recalcular estadísticas
          
          this.toastService.showSuccess(`"${nombreProducto}" eliminado exitosamente`);
          
          // Recargar datos en segundo plano sin afectar la UI
          setTimeout(() => {
            this.cargarProductos();
            this.cargarProductosEliminados();
          }, 500);
        }
        break;
        
      case 'restore':
        const sub = this.barService.restoreProducto(this.productoParaEliminar).subscribe({
          next: (success) => {
            if (success) {
              // 🔧 FIX: Remover de la lista de eliminados inmediatamente
              const nombreProducto = this.productosEliminados.find(p => p.id === this.productoParaEliminar)?.nombre || 'Producto';
              
              this.productosEliminados = this.productosEliminados.filter(p => p.id !== this.productoParaEliminar);
              this.estadisticas.eliminados = this.productosEliminados.length;
              
              this.toastService.showSuccess(`"${nombreProducto}" restaurado exitosamente`);
              
              // Recargar datos principales en segundo plano
              setTimeout(() => {
                this.cargarProductos();
              }, 500);
            }
            this.procesando = false;
          },
          error: (error) => {
            console.error('Error al restaurar:', error);
            this.procesando = false;
          }
        });
        this.subscriptions.add(sub);
        break;
        
      case 'hard':
        const hardSub = this.barService.hardDeleteProducto(this.productoParaEliminar).subscribe({
          next: (success) => {
            if (success) {
              // 🔧 FIX: Remover de la lista de eliminados inmediatamente
              const nombreProducto = this.productosEliminados.find(p => p.id === this.productoParaEliminar)?.nombre || 'Producto';
              
              this.productosEliminados = this.productosEliminados.filter(p => p.id !== this.productoParaEliminar);
              this.estadisticas.eliminados = this.productosEliminados.length;
              
              this.toastService.showSuccess(`"${nombreProducto}" eliminado permanentemente`);
            }
            this.procesando = false;
          },
          error: (error) => {
            console.error('Error al eliminar permanentemente:', error);
            this.procesando = false;
          }
        });
        this.subscriptions.add(hardSub);
        break;
    }
    
    if (this.tipoEliminacion === 'soft') {
      this.procesando = false;
    }
    
  } catch (error) {
    console.error('Error al procesar eliminación:', error);
    this.toastService.showError('Error inesperado al procesar la acción');
    this.procesando = false;
  } finally {
    this.cerrarModalConfirmacion();
  }
}

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion = false;
    this.productoParaEliminar = -1;
    this.tipoEliminacion = 'soft';
  }

  // 🆕 MODIFICADO: Toggle disponibilidad usando nuevo método
  toggleDisponibilidad(producto: ProductoBar): void {
    const exito = this.barService.toggleDisponibilidad(producto.id);
    
    if (exito) {
      // Recargar productos para reflejar cambios
      setTimeout(() => this.cargarProductos(), 500);
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
      eliminados: this.estadisticas.eliminados, // Mantener el valor actual
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
      descuento: 0,
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

  // 🆕 NUEVOS MÉTODOS PARA OBTENER MENSAJES DE CONFIRMACIÓN
  getTituloModal(): string {
    switch (this.tipoEliminacion) {
      case 'soft': return 'Confirmar Eliminación';
      case 'hard': return 'Eliminar Permanentemente';
      case 'restore': return 'Confirmar Restauración';
      default: return 'Confirmar Acción';
    }
  }

  getMensajeModal(): string {
    switch (this.tipoEliminacion) {
      case 'soft': 
        return '¿Estás seguro de que deseas eliminar este producto? Se moverá a la papelera pero podrás restaurarlo después.';
      case 'hard': 
        return '¿Estás seguro de que deseas eliminar este producto PERMANENTEMENTE? Esta acción no se puede deshacer.';
      case 'restore': 
        return '¿Estás seguro de que deseas restaurar este producto? Volverá a estar disponible en la lista principal.';
      default: 
        return '¿Estás seguro de que deseas realizar esta acción?';
    }
  }

  getTextoBotonModal(): string {
    switch (this.tipoEliminacion) {
      case 'soft': return 'Eliminar';
      case 'hard': return 'Eliminar Permanentemente';
      case 'restore': return 'Restaurar';
      default: return 'Confirmar';
    }
  }

  getClaseBotonModal(): string {
    switch (this.tipoEliminacion) {
      case 'soft': return 'btn-warning';
      case 'hard': return 'btn-danger';
      case 'restore': return 'btn-success';
      default: return 'btn-primary';
    }
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