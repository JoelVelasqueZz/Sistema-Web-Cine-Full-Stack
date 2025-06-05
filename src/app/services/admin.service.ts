import { Injectable } from '@angular/core';
import { MovieService, Pelicula, FuncionCine } from './movie.service';
import { UserService, PeliculaFavorita, HistorialItem } from './user.service';
import { AuthService, Usuario } from './auth.service';
// AGREGAR ESTA IMPORTACIÓN PARA EL BAR SERVICE
import { BarService, ProductoBar } from './bar.service';

// ==================== INTERFACES EXISTENTES ====================
export interface AdminStats {
  totalPeliculas: number;
  totalUsuarios: number;
  totalVentas: number;
  ingresosMes: number;
  usuariosActivos: number;
  peliculasPopulares: PeliculaPopular[];
  ventasRecientes: VentaReciente[];
  generosMasPopulares: GeneroStats[];
  actividadReciente: ActividadReciente[];
}

export interface PeliculaPopular {
  titulo: string;
  vistas: number;
  rating: number;
  genero: string;
}

export interface VentaReciente {
  id: string;
  usuario: string;
  pelicula: string;
  fecha: string;
  total: number;
  estado: 'completada' | 'pendiente' | 'cancelada';
  entradas: number;
}

export interface GeneroStats {
  genero: string;
  cantidad: number;
  porcentaje: number;
}

export interface ActividadReciente {
  tipo: 'registro' | 'compra' | 'pelicula_agregada';
  descripcion: string;
  fecha: string;
  icono: string;
  color: string;
}

// ==================== NUEVAS INTERFACES PARA EL BAR ====================
export interface BarStats {
  totalProductos: number;
  productosDisponibles: number;
  productosNoDisponibles: number;
  totalCombos: number;
  totalCategorias: number;
  precioPromedio: number;
  precioMinimo: number;
  precioMaximo: number;
  ahorroTotalCombos: number;
  categoriaStats: { [key: string]: number };
  productosPorCategoria: CategoriaBarStats[];
  ventasSimuladasBar: VentaBarSimulada[];
  productosPopularesBar: ProductoPopularBar[];
  tendenciasBar: TendenciasBar;
}

export interface CategoriaBarStats {
  categoria: string;
  cantidad: number;
  disponibles: number;
  combos: number;
  precioPromedio: number;
  precioMinimo: number;
  precioMaximo: number;
  porcentaje: number;
}

export interface VentaBarSimulada {
  id: string;
  producto: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  fecha: string;
  esCombo: boolean;
  cliente: string;
  metodoPago: string;
}

export interface ProductoPopularBar {
  nombre: string;
  categoria: string;
  ventasSimuladas: number;
  ingresoSimulado: number;
  disponible: boolean;
  esCombo: boolean;
  precio: number;
}

export interface TendenciasBar {
  ventasUltimos7Dias: number;
  ingresoUltimos7Dias: number;
  ventasUltimos30Dias: number;
  ingresoUltimos30Dias: number;
  productoMasVendido: string;
  categoriaMasPopular: string;
  promedioVentaDiaria: number;
  promedioIngresoDiario: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  
  // Datos simulados para el dashboard
  private ventasSimuladas: VentaReciente[] = [
    {
      id: 'V001',
      usuario: 'Juan Pérez',
      pelicula: 'Avatar: El Camino del Agua',
      fecha: '2025-05-28',
      total: 25.50,
      estado: 'completada',
      entradas: 2
    },
    {
      id: 'V002',
      usuario: 'María García',
      pelicula: 'Top Gun: Maverick',
      fecha: '2025-05-29',
      total: 38.25,
      estado: 'completada',
      entradas: 3
    },
    {
      id: 'V003',
      usuario: 'Carlos López',
      pelicula: 'Black Panther: Wakanda Forever',
      fecha: '2025-05-30',
      total: 17.00,
      estado: 'pendiente',
      entradas: 1
    },
    {
      id: 'V004',
      usuario: 'Ana Martínez',
      pelicula: 'Dune',
      fecha: '2025-05-31',
      total: 45.75,
      estado: 'completada',
      entradas: 3
    },
    {
      id: 'V005',
      usuario: 'Pedro Rodríguez',
      pelicula: 'Spider-Man: No Way Home',
      fecha: '2025-06-01',
      total: 21.25,
      estado: 'completada',
      entradas: 1
    }
  ];

  private actividadSimulada: ActividadReciente[] = [
    {
      tipo: 'registro',
      descripcion: 'Nuevo usuario registrado: Ana Martínez',
      fecha: '2025-06-01 14:30',
      icono: 'fas fa-user-plus',
      color: 'success'
    },
    {
      tipo: 'compra',
      descripcion: 'Pedro compró 1 entrada para Spider-Man',
      fecha: '2025-06-01 13:15',
      icono: 'fas fa-shopping-cart',
      color: 'primary'
    },
    {
      tipo: 'pelicula_agregada',
      descripcion: 'Nueva película agregada: Guardians of Galaxy Vol. 3',
      fecha: '2025-06-01 10:45',
      icono: 'fas fa-film',
      color: 'info'
    }
  ];

  constructor(
    private movieService: MovieService,
    private userService: UserService,
    private authService: AuthService,
    // AGREGAR LA INYECCIÓN DEL BAR SERVICE
    private barService: BarService
  ) { }

  // ==================== DASHBOARD STATS ====================
  
  getAdminStats(): AdminStats {
    const peliculas = this.movieService.getPeliculas();
    const usuarios = this.getAllUsersFromAuth();
    
    return {
      totalPeliculas: peliculas.length,
      totalUsuarios: usuarios.length,
      totalVentas: this.ventasSimuladas.length,
      ingresosMes: this.calculateIngresosMes(),
      usuariosActivos: usuarios.filter(u => u.isActive !== false).length,
      peliculasPopulares: this.getPeliculasPopulares(),
      ventasRecientes: this.ventasSimuladas.slice(-5),
      generosMasPopulares: this.getGeneroStats(),
      actividadReciente: this.actividadSimulada.slice(-10)
    };
  }

  private calculateIngresosMes(): number {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const anioActual = fechaActual.getFullYear();
    
    return this.ventasSimuladas
      .filter(v => {
        const fechaVenta = new Date(v.fecha);
        return v.estado === 'completada' && 
               fechaVenta.getMonth() === mesActual && 
               fechaVenta.getFullYear() === anioActual;
      })
      .reduce((sum, v) => sum + v.total, 0);
  }

  private getPeliculasPopulares(): PeliculaPopular[] {
    const peliculas = this.movieService.getPeliculas();
    
    return peliculas
      .map(p => ({
        titulo: p.titulo,
        vistas: Math.floor(Math.random() * 1000) + 100,
        rating: p.rating,
        genero: p.genero
      }))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5);
  }

  private getGeneroStats(): GeneroStats[] {
    const peliculas = this.movieService.getPeliculas();
    const generos: { [key: string]: number } = {};
    
    peliculas.forEach(p => {
      generos[p.genero] = (generos[p.genero] || 0) + 1;
    });
    
    const total = peliculas.length;
    return Object.entries(generos).map(([genero, cantidad]) => ({
      genero,
      cantidad,
      porcentaje: Math.round((cantidad / total) * 100)
    }));
  }

  // ==================== GESTIÓN DE PELÍCULAS ====================
  
  createPelicula(peliculaData: Omit<Pelicula, 'idx'>): boolean {
    try {
      const validacion = this.movieService.validatePeliculaData(peliculaData);
      if (!validacion.valid) {
        console.error('Datos de película inválidos:', validacion.errors);
        return false;
      }

      const resultado = this.movieService.addPelicula(peliculaData);
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Nueva película agregada: ${peliculaData.titulo}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-film',
          color: 'info'
        });
        
        console.log('✅ Película creada exitosamente:', peliculaData.titulo);
      } else {
        console.error('❌ Error al crear película en MovieService');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al crear película:', error);
      return false;
    }
  }

  updatePelicula(peliculaIndex: number, peliculaData: Partial<Pelicula>): boolean {
    try {
      if (peliculaData.titulo || peliculaData.sinopsis || peliculaData.genero) {
        const validacion = this.movieService.validatePeliculaData(peliculaData);
        if (!validacion.valid) {
          console.error('Datos de película inválidos:', validacion.errors);
          return false;
        }
      }

      const resultado = this.movieService.updatePelicula(peliculaIndex, peliculaData);
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Película actualizada: ${peliculaData.titulo || 'Sin título'}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-edit',
          color: 'warning'
        });
        
        console.log('✅ Película actualizada exitosamente');
      } else {
        console.error('❌ Error al actualizar película en MovieService');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al actualizar película:', error);
      return false;
    }
  }

  deletePelicula(peliculaIndex: number): boolean {
    try {
      const pelicula = this.movieService.getPelicula(peliculaIndex);
      
      if (!pelicula) {
        console.error('❌ Película no encontrada en el índice:', peliculaIndex);
        return false;
      }
      
      const resultado = this.movieService.deletePelicula(peliculaIndex);
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Película eliminada: ${pelicula.titulo}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-trash',
          color: 'danger'
        });
        
        console.log('✅ Película eliminada exitosamente:', pelicula.titulo);
      } else {
        console.error('❌ Error al eliminar película en MovieService');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al eliminar película:', error);
      return false;
    }
  }

  validatePeliculaData(pelicula: Partial<Pelicula>): { valid: boolean; errors: string[] } {
    return this.movieService.validatePeliculaData(pelicula);
  }

  getAllPeliculas(): Pelicula[] {
    return this.movieService.getPeliculas();
  }

  buscarPeliculas(termino: string): Pelicula[] {
    return this.movieService.buscarPeliculas(termino);
  }

  // ==================== GESTIÓN DE FUNCIONES ====================

  addFuncionToPelicula(peliculaIndex: number, funcion: Omit<FuncionCine, 'id'>): boolean {
    try {
      const resultado = this.movieService.addFuncionToPelicula(peliculaIndex, funcion);
      
      if (resultado) {
        const pelicula = this.movieService.getPelicula(peliculaIndex);
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Nueva función agregada para: ${pelicula?.titulo || 'Película'}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-calendar-plus',
          color: 'success'
        });
        
        console.log('✅ Función agregada exitosamente');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al agregar función:', error);
      return false;
    }
  }

  deleteFuncion(funcionId: string): boolean {
    try {
      const resultado = this.movieService.deleteFuncion(funcionId);
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Función eliminada: ${funcionId}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-calendar-times',
          color: 'warning'
        });
        
        console.log('✅ Función eliminada exitosamente');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al eliminar función:', error);
      return false;
    }
  }

  getFuncionesPelicula(peliculaIndex: number): FuncionCine[] {
    return this.movieService.getFuncionesPelicula(peliculaIndex);
  }

  // ==================== GESTIÓN DE USUARIOS ====================
  
  private getAllUsersFromAuth(): Usuario[] {
    return this.authService.getAllRegisteredUsers();
  }

  getAllUsers(): Usuario[] {
    return this.getAllUsersFromAuth();
  }

  changeUserRole(userId: number, nuevoRol: 'cliente' | 'admin'): boolean {
    try {
      const usuario = this.authService.findUserById(userId);
      if (usuario) {
        usuario.role = nuevoRol;
        
        this.addActividad({
          tipo: 'registro',
          descripcion: `Usuario ${usuario.nombre} ahora es ${nuevoRol}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-user-cog',
          color: 'warning'
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      return false;
    }
  }

  toggleUserStatus(userId: number): boolean {
    try {
      const usuario = this.authService.findUserById(userId);
      if (usuario) {
        usuario.isActive = !usuario.isActive;
        
        this.addActividad({
          tipo: 'registro',
          descripcion: `Estado del usuario ${usuario.nombre} cambiado a ${usuario.isActive ? 'activo' : 'inactivo'}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-user-check',
          color: 'success'
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      return false;
    }
  }

  // ==================== REPORTES DEL BAR ====================
  
  /**
   * Obtener estadísticas completas del bar
   */
  getBarStats(): BarStats {
    const productos = this.barService.getProductos();
    
    // Estadísticas por categoría
    const categoriaStats: { [key: string]: number } = {};
    productos.forEach(p => {
      categoriaStats[p.categoria] = (categoriaStats[p.categoria] || 0) + 1;
    });

    // Productos más caros y más baratos
    const precios = productos.map(p => p.precio).sort((a, b) => a - b);
    const precioPromedio = precios.length > 0 ? precios.reduce((sum, p) => sum + p, 0) / precios.length : 0;

    // Análisis de combos
    const combos = productos.filter(p => p.esCombo);
    const ahorroTotalCombos = combos.reduce((sum, c) => sum + (c.descuento || 0), 0);

    return {
      totalProductos: productos.length,
      productosDisponibles: productos.filter(p => p.disponible).length,
      productosNoDisponibles: productos.filter(p => !p.disponible).length,
      totalCombos: combos.length,
      totalCategorias: Object.keys(categoriaStats).length,
      precioPromedio: Math.round(precioPromedio * 100) / 100,
      precioMinimo: precios.length > 0 ? Math.min(...precios) : 0,
      precioMaximo: precios.length > 0 ? Math.max(...precios) : 0,
      ahorroTotalCombos: ahorroTotalCombos,
      categoriaStats: categoriaStats,
      productosPorCategoria: this.getProductosPorCategoria(),
      ventasSimuladasBar: this.getVentasSimuladasBar(),
      productosPopularesBar: this.getProductosPopularesBar(),
      tendenciasBar: this.getTendenciasBar()
    };
  }

  /**
   * Obtener productos por categoría con estadísticas
   */
  private getProductosPorCategoria(): CategoriaBarStats[] {
    const productos = this.barService.getProductos();
    const categorias: { [key: string]: ProductoBar[] } = {};
    
    productos.forEach(p => {
      if (!categorias[p.categoria]) {
        categorias[p.categoria] = [];
      }
      categorias[p.categoria].push(p);
    });

    return Object.entries(categorias).map(([categoria, prods]) => ({
      categoria,
      cantidad: prods.length,
      disponibles: prods.filter(p => p.disponible).length,
      combos: prods.filter(p => p.esCombo).length,
      precioPromedio: Math.round((prods.reduce((sum, p) => sum + p.precio, 0) / prods.length) * 100) / 100,
      precioMinimo: Math.min(...prods.map(p => p.precio)),
      precioMaximo: Math.max(...prods.map(p => p.precio)),
      porcentaje: Math.round((prods.length / productos.length) * 100)
    })).sort((a, b) => b.cantidad - a.cantidad);
  }

  /**
   * Simular ventas del bar para reportes
   */
  private getVentasSimuladasBar(): VentaBarSimulada[] {
    const productos = this.barService.getProductos();
    const ventas: VentaBarSimulada[] = [];
    
    for (let i = 0; i < 50; i++) {
      const producto = productos[Math.floor(Math.random() * productos.length)];
      const cantidad = Math.floor(Math.random() * 5) + 1;
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));
      
      ventas.push({
        id: `VB${String(i + 1).padStart(3, '0')}`,
        producto: producto.nombre,
        categoria: producto.categoria,
        cantidad: cantidad,
        precioUnitario: producto.precio,
        total: producto.precio * cantidad,
        fecha: fecha.toISOString().split('T')[0],
        esCombo: producto.esCombo,
        cliente: this.getRandomCliente(),
        metodoPago: this.getRandomMetodoPago()
      });
    }
    
    return ventas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  /**
   * Obtener productos más populares del bar (simulado)
   */
  private getProductosPopularesBar(): ProductoPopularBar[] {
    const productos = this.barService.getProductos();
    
    return productos.map(p => ({
      nombre: p.nombre,
      categoria: p.categoria,
      ventasSimuladas: Math.floor(Math.random() * 200) + 50,
      ingresoSimulado: (Math.floor(Math.random() * 200) + 50) * p.precio,
      disponible: p.disponible,
      esCombo: p.esCombo,
      precio: p.precio
    })).sort((a, b) => b.ventasSimuladas - a.ventasSimuladas).slice(0, 10);
  }

  /**
   * Obtener tendencias del bar
   */
  private getTendenciasBar(): TendenciasBar {
    const ventasBar = this.getVentasSimuladasBar();
    const hoy = new Date();
    const hace7Dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
    const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const ventasSemana = ventasBar.filter(v => new Date(v.fecha) >= hace7Dias);
    const ventasMes = ventasBar.filter(v => new Date(v.fecha) >= hace30Dias);
    
    return {
      ventasUltimos7Dias: ventasSemana.length,
      ingresoUltimos7Dias: ventasSemana.reduce((sum, v) => sum + v.total, 0),
      ventasUltimos30Dias: ventasMes.length,
      ingresoUltimos30Dias: ventasMes.reduce((sum, v) => sum + v.total, 0),
      productoMasVendido: this.getProductoMasVendido(ventasMes),
      categoriaMasPopular: this.getCategoriaMasPopular(ventasMes),
      promedioVentaDiaria: Math.round(ventasMes.length / 30),
      promedioIngresoDiario: Math.round((ventasMes.reduce((sum, v) => sum + v.total, 0) / 30) * 100) / 100
    };
  }

  // ==================== GESTIÓN DE PRODUCTOS DEL BAR ====================
  
  /**
   * Crear nuevo producto del bar
   */
  createProductoBar(productoData: Omit<ProductoBar, 'id'>): boolean {
    try {
      const resultado = this.barService.addProducto(productoData);
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada', // Usar el mismo tipo o crear uno nuevo si es necesario
          descripcion: `Nuevo producto del bar agregado: ${productoData.nombre}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-cocktail',
          color: 'info'
        });
        
        console.log('✅ Producto del bar creado exitosamente:', productoData.nombre);
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al crear producto del bar:', error);
      return false;
    }
  }

  /**
   * Actualizar producto del bar
   */
  updateProductoBar(productoId: string, productoData: Partial<ProductoBar>): boolean {
    try {
      const resultado = this.barService.updateProducto(Number(productoId), productoData);
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Producto del bar actualizado: ${productoData.nombre || 'Sin nombre'}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-edit',
          color: 'warning'
        });
        
        console.log('✅ Producto del bar actualizado exitosamente');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al actualizar producto del bar:', error);
      return false;
    }
  }

  /**
   * Eliminar producto del bar
   */
  deleteProductoBar(productoId: string): boolean {
    try {
      const producto = this.barService.getProducto(Number(productoId));
      const resultado = this.barService.deleteProducto(Number(productoId));
      
      if (resultado) {
        this.addActividad({
          tipo: 'pelicula_agregada',
          descripcion: `Producto del bar eliminado: ${producto?.nombre || 'Producto'}`,
          fecha: new Date().toISOString(),
          icono: 'fas fa-trash',
          color: 'danger'
        });
        
        console.log('✅ Producto del bar eliminado exitosamente');
      }
      
      return resultado;
      
    } catch (error) {
      console.error('❌ Error al eliminar producto del bar:', error);
      return false;
    }
  }

  /**
   * Obtener todos los productos del bar
   */
  getAllProductosBar(): ProductoBar[] {
    return this.barService.getProductos();
  }

  /**
   * Buscar productos del bar
   */
  buscarProductosBar(termino: string): ProductoBar[] {
    return this.barService.buscarProductos(termino);
  }

  // ==================== REPORTES Y ANALYTICS ====================
  
  getVentasReport(fechaInicio: string, fechaFin: string): any {
    const ventasFiltradas = this.ventasSimuladas.filter(v => 
      v.fecha >= fechaInicio && v.fecha <= fechaFin
    );
    return {
      totalVentas: ventasFiltradas.length,
      ingresoTotal: ventasFiltradas
        .filter(v => v.estado === 'completada')
        .reduce((sum, v) => sum + v.total, 0),
      entradasVendidas: ventasFiltradas
        .reduce((sum, v) => sum + v.entradas, 0),
      ventasPorDia: this.groupVentasByDate(ventasFiltradas)
    };
  }

  private groupVentasByDate(ventas: VentaReciente[]): any[] {
    const grouped = ventas.reduce((acc, venta) => {
      const fecha = venta.fecha;
      if (!acc[fecha]) {
        acc[fecha] = { fecha, ventas: 0, ingresos: 0 };
      }
      acc[fecha].ventas++;
      if (venta.estado === 'completada') {
        acc[fecha].ingresos += venta.total;
      }
      return acc;
    }, {} as any);
    return Object.values(grouped);
  }

  // ==================== MÉTODOS AUXILIARES PARA EL BAR ====================
  
  private getRandomCliente(): string {
    const clientes = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Pedro Rodríguez', 'Laura Sánchez'];
    return clientes[Math.floor(Math.random() * clientes.length)];
  }

  private getRandomMetodoPago(): string {
    const metodos = ['Efectivo', 'Tarjeta', 'PayPal', 'Transferencia'];
    return metodos[Math.floor(Math.random() * metodos.length)];
  }

  private getProductoMasVendido(ventas: VentaBarSimulada[]): string {
    const ventasPorProducto: { [key: string]: number } = {};
    ventas.forEach(v => {
      ventasPorProducto[v.producto] = (ventasPorProducto[v.producto] || 0) + v.cantidad;
    });
    
    return Object.keys(ventasPorProducto).reduce((a, b) => 
      ventasPorProducto[a] > ventasPorProducto[b] ? a : b, 'N/A'
    );
  }

  private getCategoriaMasPopular(ventas: VentaBarSimulada[]): string {
    const ventasPorCategoria: { [key: string]: number } = {};
    ventas.forEach(v => {
      ventasPorCategoria[v.categoria] = (ventasPorCategoria[v.categoria] || 0) + v.cantidad;
    });
    
    return Object.keys(ventasPorCategoria).reduce((a, b) => 
      ventasPorCategoria[a] > ventasPorCategoria[b] ? a : b, 'N/A'
    );
  }

  // ==================== UTILIDADES ====================
  
  private addActividad(actividad: ActividadReciente): void {
    this.actividadSimulada.unshift(actividad);
    if (this.actividadSimulada.length > 20) {
      this.actividadSimulada = this.actividadSimulada.slice(0, 20);
    }
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }

  // Simular nueva venta (para testing)
  addVentaSimulada(venta: Omit<VentaReciente, 'id'>): void {
    const nuevaVenta: VentaReciente = {
      ...venta,
      id: 'V' + (this.ventasSimuladas.length + 1).toString().padStart(3, '0')
    };
    
    this.ventasSimuladas.push(nuevaVenta);
    
    this.addActividad({
      tipo: 'compra',
      descripcion: `${venta.usuario} compró ${venta.entradas} entrada(s) para ${venta.pelicula}`,
      fecha: new Date().toISOString(),
      icono: 'fas fa-shopping-cart',
      color: 'primary'
    });
  }

  // Simular nueva venta del bar (para testing)
  addVentaBarSimulada(venta: Omit<VentaBarSimulada, 'id'>): void {
    const nuevaVenta: VentaBarSimulada = {
      ...venta,
      id: 'VB' + (this.getVentasSimuladasBar().length + 1).toString().padStart(3, '0')
    };
    
    this.addActividad({
      tipo: 'compra',
      descripcion: `${venta.cliente} compró ${venta.cantidad} ${venta.producto} del bar`,
      fecha: new Date().toISOString(),
      icono: 'fas fa-cocktail',
      color: 'primary'
    });
  }

  // ==================== REPORTES PDF DEL BAR ====================
  
  /**
   * Generar reporte completo del bar en PDF
   * NOTA: Para usar este método necesitarás instalar jsPDF y jspdf-autotable:
   * npm install jspdf jspdf-autotable
   * npm install @types/jspdf --save-dev
   */
  generateBarReport(): void {
    // Importar jsPDF dinámicamente para evitar errores si no está instalado
    import('jspdf').then((jsPDFModule) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        this.generatingReport = true;
        console.log('Generando reporte completo del bar...');
        
        setTimeout(() => {
          try {
            const doc = new jsPDFModule.default();
            const barStats = this.getBarStats();
            
            // === PÁGINA 1: RESUMEN EJECUTIVO ===
            this.setupPDFHeader(doc, 'REPORTE COMPLETO DEL BAR', 
              'Análisis detallado de productos y ventas del bar');
            
            let currentY = 110;
            
            // Resumen ejecutivo del bar
            currentY = this.addBarExecutiveSummary(doc, currentY, barStats, autoTable);
            
            // === PÁGINA 2: ANÁLISIS POR CATEGORÍAS ===
            doc.addPage();
            this.setupPDFHeader(doc, 'ANÁLISIS POR CATEGORÍAS', 'Desglose detallado por tipo de producto');
            
            currentY = 110;
            currentY = this.addCategoryAnalysis(doc, currentY, barStats, autoTable);
            
            // === PÁGINA 3: PRODUCTOS POPULARES Y VENTAS ===
            doc.addPage();
            this.setupPDFHeader(doc, 'PRODUCTOS POPULARES Y VENTAS', 'Análisis de rendimiento por producto');
            
            currentY = 110;
            currentY = this.addPopularProductsAnalysis(doc, currentY, barStats, autoTable);
            
            // === PÁGINA 4: RECOMENDACIONES ===
            doc.addPage();
            this.setupPDFHeader(doc, 'RECOMENDACIONES Y ESTRATEGIAS', 'Plan de acción para optimizar el bar');
            
            currentY = 110;
            this.addBarRecommendations(doc, currentY, barStats);
            
            // Configurar pie de página
            this.setupPDFFooter(doc);
            
            // Descargar PDF
            doc.save(`reporte-bar-completo-${new Date().toISOString().split('T')[0]}.pdf`);
            
            this.generatingReport = false;
            console.log('Reporte completo del bar generado exitosamente');
            
          } catch (error) {
            console.error('Error generando reporte del bar:', error);
            this.generatingReport = false;
            console.error('Error al generar el reporte del bar');
          }
        }, 2000);
      }).catch(error => {
        console.error('Error: jspdf-autotable no está instalado', error);
      });
    }).catch(error => {
      console.error('Error: jsPDF no está instalado', error);
    });
  }

  // Variable para controlar el estado de generación de reportes
  private generatingReport = false;

  // ==================== MÉTODOS PDF AUXILIARES ====================
  
  /**
   * Configurar encabezado del PDF
   */
  private setupPDFHeader(doc: any, title: string, subtitle: string): void {
    // Fondo del encabezado
    doc.setFillColor(255, 193, 7);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Título principal
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 105, 25, { align: 'center' });
    
    // Subtítulo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 105, 35, { align: 'center' });
    
    // Fecha
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, 105, 45, { align: 'center' });
    
    // Línea separadora
    doc.setDrawColor(0, 0, 0);
    doc.line(20, 60, 190, 60);
  }

  /**
   * Configurar pie de página del PDF
   */
  private setupPDFFooter(doc: any): void {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Línea separadora
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 280, 190, 280);
      
      // Información del pie
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Sistema de Gestión Cinematográfica - Reporte Automatizado', 20, 285);
      doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
      doc.text(`Generado: ${new Date().toLocaleString()}`, 105, 290, { align: 'center' });
    }
  }

  /**
   * Agregar resumen ejecutivo del bar al PDF
   */
  private addBarExecutiveSummary(doc: any, startY: number, stats: BarStats, autoTable: any): number {
    let currentY = startY;
    
    // Título de sección
    doc.setFillColor(255, 193, 7);
    doc.rect(20, currentY - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('RESUMEN EJECUTIVO DEL BAR', 25, currentY + 5);
    currentY += 20;
    
    // Métricas principales en tabla
    const executiveData = [
      ['Total de Productos', stats.totalProductos.toString()],
      ['Productos Disponibles', `${stats.productosDisponibles} (${Math.round((stats.productosDisponibles/stats.totalProductos)*100)}%)`],
      ['Combos Especiales', `${stats.totalCombos} combos`],
      ['Categorías Diferentes', `${stats.totalCategorias} categorías`],
      ['Precio Promedio', `${stats.precioPromedio}`],
      ['Rango de Precios', `${stats.precioMinimo} - ${stats.precioMaximo}`],
      ['Ahorro Total en Combos', `${stats.ahorroTotalCombos.toFixed(2)}`],
      ['Ventas Simuladas (30d)', `${stats.ventasSimuladasBar.length} transacciones`]
    ];
    
    autoTable(doc, {
      body: executiveData,
      startY: currentY,
      theme: 'plain',
      styles: { 
        fontSize: 11,
        cellPadding: { top: 5, right: 10, bottom: 5, left: 10 }
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100, fillColor: [255, 248, 220] },
        1: { cellWidth: 70, halign: 'center', fillColor: [255, 255, 255] }
      }
    });
    
    return (doc as any).lastAutoTable.finalY + 20;
  }

  /**
   * Agregar análisis por categorías al PDF
   */
  private addCategoryAnalysis(doc: any, startY: number, stats: BarStats, autoTable: any): number {
    let currentY = startY;
    
    // Título de sección
    doc.setFillColor(255, 193, 7);
    doc.rect(20, currentY - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('ANÁLISIS POR CATEGORÍAS', 25, currentY + 5);
    currentY += 15;
    
    const categoryData = stats.productosPorCategoria.map((cat, index) => [
      (index + 1).toString(),
      cat.categoria,
      cat.cantidad.toString(),
      `${cat.disponibles}/${cat.cantidad}`,
      cat.combos.toString(),
      `${cat.precioPromedio}`,
      `${cat.porcentaje}%`
    ]);
    
    autoTable(doc, {
      head: [['#', 'Categoría', 'Total', 'Disponibles', 'Combos', 'Precio Prom.', '% Total']],
      body: categoryData,
      startY: currentY,
      theme: 'striped',
      headStyles: { 
        fillColor: [255, 193, 7],
        textColor: [0, 0, 0],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 40 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 30, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' }
      },
      alternateRowStyles: { fillColor: [255, 248, 220] }
    });
    
    return (doc as any).lastAutoTable.finalY + 20;
  }

  /**
   * Agregar análisis de productos populares al PDF
   */
  private addPopularProductsAnalysis(doc: any, startY: number, stats: BarStats, autoTable: any): number {
    let currentY = startY;
    
    // Título de sección
    doc.setFillColor(255, 193, 7);
    doc.rect(20, currentY - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('TOP 10 PRODUCTOS MÁS POPULARES', 25, currentY + 5);
    currentY += 15;
    
    const popularData = stats.productosPopularesBar.slice(0, 10).map((prod, index) => [
      this.getRankIcon(index + 1),
      prod.nombre,
      prod.categoria,
      prod.ventasSimuladas.toString(),
      `${prod.ingresoSimulado.toFixed(2)}`,
      `${prod.precio.toFixed(2)}`,
      prod.esCombo ? 'Sí' : 'No'
    ]);
    
    autoTable(doc, {
      head: [['Pos', 'Producto', 'Categoría', 'Ventas', 'Ingresos', 'Precio', 'Combo']],
      body: popularData,
      startY: currentY,
      theme: 'striped',
      headStyles: { 
        fillColor: [255, 193, 7],
        textColor: [0, 0, 0],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 9,
        cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' }
      },
      alternateRowStyles: { fillColor: [255, 248, 220] }
    });
    
    return (doc as any).lastAutoTable.finalY + 20;
  }

  /**
   * Agregar recomendaciones del bar al PDF
   */
  private addBarRecommendations(doc: any, startY: number, stats: BarStats): void {
    let currentY = startY;
    
    // Título de sección
    doc.setFillColor(255, 193, 7);
    doc.rect(20, currentY - 5, 170, 15, 'F');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('RECOMENDACIONES ESTRATÉGICAS', 25, currentY + 5);
    currentY += 20;
    
    const recomendaciones = [
      {
        categoria: 'Optimización de Productos',
        acciones: [
          'Promocionar más los combos especiales para aumentar ticket promedio',
          'Revisar precios de productos con baja rotación',
          'Crear nuevos combos basados en productos populares',
          'Implementar descuentos por volumen en categorías menos vendidas'
        ]
      },
      {
        categoria: 'Gestión de Inventario',
        acciones: [
          'Aumentar stock de productos más vendidos',
          'Evaluar eliminar productos con ventas muy bajas',
          'Implementar alertas automáticas de stock bajo',
          'Negociar mejores precios con proveedores de productos populares'
        ]
      },
      {
        categoria: 'Experiencia del Cliente',
        acciones: [
          'Crear menús visuales atractivos para el bar',
          'Implementar sistema de pedidos online',
          'Ofrecer muestras gratuitas de nuevos productos',
          'Desarrollar programa de puntos para clientes frecuentes'
        ]
      }
    ];
    
    recomendaciones.forEach(seccion => {
      doc.setFontSize(12);
      doc.setTextColor(255, 140, 0);
      doc.text(`${seccion.categoria.toUpperCase()}`, 25, currentY);
      currentY += 15;
      
      seccion.acciones.forEach(accion => {
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`• ${accion}`, 30, currentY);
        currentY += 8;
      });
      currentY += 5;
    });
  }

  /**
   * Obtener icono de ranking para el PDF
   */
  private getRankIcon(position: number): string {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}°`;
  }

  // ==================== MÉTODOS PARA EXTENDER TUS SERVICIOS ====================
  
  // Estos métodos los puedes agregar a tu MovieService cuando tengas backend
  addPeliculaToService(pelicula: Pelicula): boolean {
    console.log('Agregando película al servicio:', pelicula);
    return true;
  }

  updatePeliculaInService(index: number, pelicula: Partial<Pelicula>): boolean {
    console.log('Actualizando película en servicio:', index, pelicula);
    return true;
  }

  deletePeliculaFromService(index: number): boolean {
    console.log('Eliminando película del servicio:', index);
    return true;
  }

  // ==================== GETTERS PARA ESTADO ====================
  
  /**
   * Verificar si se está generando un reporte
   */
  isGeneratingReport(): boolean {
    return this.generatingReport;
  }

  /**
   * Obtener estadísticas combinadas (películas + bar)
   */
  getCombinedStats(): { 
    peliculas: AdminStats, 
    bar: BarStats,
    resumen: {
      totalProductosCine: number;
      totalProductosBar: number;
      ingresosTotales: number;
      actividadReciente: ActividadReciente[];
    }
  } {
    const peliculasStats = this.getAdminStats();
    const barStats = this.getBarStats();
    
    return {
      peliculas: peliculasStats,
      bar: barStats,
      resumen: {
        totalProductosCine: peliculasStats.totalPeliculas,
        totalProductosBar: barStats.totalProductos,
        ingresosTotales: peliculasStats.ingresosMes + barStats.tendenciasBar.ingresoUltimos30Dias,
        actividadReciente: peliculasStats.actividadReciente
      }
    };
  }
}