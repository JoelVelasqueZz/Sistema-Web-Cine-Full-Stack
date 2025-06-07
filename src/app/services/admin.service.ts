import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { MovieService, Pelicula, FuncionCine } from './movie.service';
import { UserService, PeliculaFavorita, HistorialItem } from './user.service';
import { AuthService, Usuario } from './auth.service';
import { BarService, ProductoBar } from './bar.service';

// 🆕 IMPORTACIONES PARA PDF
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ==================== INTERFACES ====================
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
  
  // 🆕 SUBJECT PARA NOTIFICAR CAMBIOS
  private peliculasSubject = new BehaviorSubject<Pelicula[]>([]);
  public peliculas$ = this.peliculasSubject.asObservable();
  
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
    private barService: BarService
  ) {
    console.log('🔧 AdminService inicializado');
  }

  // ==================== DASHBOARD STATS ====================
  
  getAdminStats(): Observable<AdminStats> {
    // Usar películas de la API a través de MovieService
    return this.movieService.getPeliculas().pipe(
      map(peliculas => {
        const usuarios = this.getAllUsersFromAuth();
        
        return {
          totalPeliculas: peliculas.length,
          totalUsuarios: usuarios.length,
          totalVentas: this.ventasSimuladas.length,
          ingresosMes: this.calculateIngresosMes(),
          usuariosActivos: usuarios.filter(u => u.isActive !== false).length,
          peliculasPopulares: this.getPeliculasPopulares(peliculas),
          ventasRecientes: this.ventasSimuladas.slice(-5),
          generosMasPopulares: this.getGeneroStats(peliculas),
          actividadReciente: this.actividadSimulada.slice(-10)
        };
      }),
      catchError(error => {
        console.error('❌ Error al obtener estadísticas:', error);
        // Fallback a datos locales
        return of(this.getAdminStatsLocal());
      })
    );
  }

  // Método fallback usando datos locales
  private getAdminStatsLocal(): AdminStats {
    const usuarios = this.getAllUsersFromAuth();
    
    return {
      totalPeliculas: 0,
      totalUsuarios: usuarios.length,
      totalVentas: this.ventasSimuladas.length,
      ingresosMes: this.calculateIngresosMes(),
      usuariosActivos: usuarios.filter(u => u.isActive !== false).length,
      peliculasPopulares: [],
      ventasRecientes: this.ventasSimuladas.slice(-5),
      generosMasPopulares: [],
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

  private getPeliculasPopulares(peliculas: Pelicula[]): PeliculaPopular[] {
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

  private getGeneroStats(peliculas: Pelicula[]): GeneroStats[] {
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

  // ==================== GESTIÓN DE PELÍCULAS (USANDO MOVIESERVICE) ====================
  
  /**
   * Crear película usando MovieService (que ya conecta con API)
   */
  createPelicula(peliculaData: Omit<Pelicula, 'idx' | 'id'>): Observable<boolean> {
    console.log('🎬 Creando película:', peliculaData);
    
    try {
      const validacion = this.validatePeliculaData(peliculaData);
      if (!validacion.valid) {
        console.error('❌ Datos de película inválidos:', validacion.errors);
        return of(false);
      }

      return this.movieService.addPelicula(peliculaData).pipe(
        map(success => {
          if (success) {
            this.addActividad({
              tipo: 'pelicula_agregada',
              descripcion: `Nueva película agregada: ${peliculaData.titulo}`,
              fecha: new Date().toISOString(),
              icono: 'fas fa-film',
              color: 'info'
            });
            
            console.log('✅ Película creada exitosamente:', peliculaData.titulo);
          }
          return success;
        }),
        catchError(error => {
          console.error('❌ Error al crear película:', error);
          return of(false);
        })
      );
      
    } catch (error) {
      console.error('❌ Error al crear película:', error);
      return of(false);
    }
  }

  /**
   * Actualizar película usando MovieService
   */
  updatePelicula(peliculaId: number, peliculaData: Partial<Pelicula>): Observable<boolean> {
    console.log('🎬 Actualizando película:', peliculaId, peliculaData);
    
    try {
      return this.movieService.updatePelicula(peliculaId, peliculaData).pipe(
        map(success => {
          if (success) {
            this.addActividad({
              tipo: 'pelicula_agregada',
              descripcion: `Película actualizada: ${peliculaData.titulo || 'Sin título'}`,
              fecha: new Date().toISOString(),
              icono: 'fas fa-edit',
              color: 'warning'
            });
            
            console.log('✅ Película actualizada exitosamente');
          }
          return success;
        }),
        catchError(error => {
          console.error('❌ Error al actualizar película:', error);
          return of(false);
        })
      );
      
    } catch (error) {
      console.error('❌ Error al actualizar película:', error);
      return of(false);
    }
  }

  /**
   * Eliminar película usando MovieService
   */
  deletePelicula(peliculaId: number): Observable<boolean> {
    console.log('🎬 Eliminando película:', peliculaId);
    
    try {
      return this.movieService.deletePelicula(peliculaId).pipe(
        map(success => {
          if (success) {
            this.addActividad({
              tipo: 'pelicula_agregada',
              descripcion: `Película eliminada`,
              fecha: new Date().toISOString(),
              icono: 'fas fa-trash',
              color: 'danger'
            });
            
            console.log('✅ Película eliminada exitosamente');
          }
          return success;
        }),
        catchError(error => {
          console.error('❌ Error al eliminar película:', error);
          return of(false);
        })
      );
      
    } catch (error) {
      console.error('❌ Error al eliminar película:', error);
      return of(false);
    }
  }

  /**
   * Obtener todas las películas
   */
  getAllPeliculas(): Observable<Pelicula[]> {
    return this.movieService.getPeliculas();
  }

  /**
   * Buscar películas
   */
  buscarPeliculas(termino: string): Observable<Pelicula[]> {
    return this.movieService.buscarPeliculas(termino);
  }

  /**
   * Validar datos de película
   */
  validatePeliculaData(pelicula: Partial<Pelicula>): { valid: boolean; errors: string[] } {
    return this.movieService.validatePeliculaData(pelicula);
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
  
  getBarStats(): BarStats {
    const productos = this.barService.getProductos();
    
    const categoriaStats: { [key: string]: number } = {};
    productos.forEach(p => {
      categoriaStats[p.categoria] = (categoriaStats[p.categoria] || 0) + 1;
    });

    const precios = productos.map(p => p.precio).sort((a, b) => a - b);
    const precioPromedio = precios.length > 0 ? precios.reduce((sum, p) => sum + p, 0) / precios.length : 0;
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

  // ==================== GENERACIÓN DE REPORTES PDF ====================

  /**
   * Generar reporte del bar en PDF
   */
  generateBarReport(): void {
    try {
      const doc = new jsPDF();
      const barStats = this.getBarStats();
      
      // Configurar encabezado
      this.setupPDFHeader(doc, 'REPORTE DEL BAR PARKYFILMS', 'Análisis de productos y ventas');
      
      let currentY = 110;
      
      // Estadísticas generales
      doc.setFillColor(240, 240, 240);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(52, 73, 94);
      doc.text('ESTADÍSTICAS GENERALES', 25, currentY + 5);
      currentY += 20;
      
      const generalStats = [
        ['Total de Productos', barStats.totalProductos.toString()],
        ['Productos Disponibles', barStats.productosDisponibles.toString()],
        ['Combos Especiales', barStats.totalCombos.toString()],
        ['Categorías', barStats.totalCategorias.toString()],
        ['Precio Promedio', `$${barStats.precioPromedio.toFixed(2)}`],
        ['Productos Top', barStats.productosPopularesBar.length.toString()]
      ];
      
      autoTable(doc, {
        body: generalStats,
        startY: currentY,
        theme: 'plain',
        styles: { 
          fontSize: 11,
          cellPadding: { top: 5, right: 10, bottom: 5, left: 10 }
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100, fillColor: [248, 249, 250] },
          1: { cellWidth: 70, halign: 'center', fillColor: [255, 255, 255] }
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 20;
      
      // Productos más populares
      doc.setFillColor(230, 126, 34);
      doc.rect(20, currentY - 5, 170, 15, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text('PRODUCTOS MÁS POPULARES', 25, currentY + 5);
      currentY += 15;
      
      const productsData = barStats.productosPopularesBar.slice(0, 10).map((producto: any, index: number) => [
        (index + 1).toString(),
        producto.nombre,
        producto.categoria,
        producto.ventasSimuladas.toString(),
        `$${producto.ingresoSimulado.toFixed(2)}`,
        producto.esCombo ? 'Sí' : 'No'
      ]);
      
      autoTable(doc, {
        head: [['#', 'Producto', 'Categoría', 'Ventas', 'Ingresos', 'Combo']],
        body: productsData,
        startY: currentY,
        theme: 'striped',
        headStyles: { 
          fillColor: [230, 126, 34],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9,
          cellPadding: { top: 4, right: 6, bottom: 4, left: 6 }
        },
        alternateRowStyles: { fillColor: [255, 248, 220] }
      });
      
      // Configurar pie de página
      this.setupPDFFooter(doc);
      
      // Descargar PDF
      doc.save(`reporte-bar-${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('✅ Reporte del bar generado exitosamente');
      
    } catch (error) {
      console.error('❌ Error generando reporte del bar:', error);
    }
  }

  /**
   * Obtener reporte de ventas
   */
  getVentasReport(fechaInicio: string, fechaFin: string): any {
    return {
      totalVentas: this.ventasSimuladas.length,
      entradasVendidas: this.ventasSimuladas.reduce((sum, v) => sum + v.entradas, 0),
      ingresoTotal: this.ventasSimuladas.reduce((sum, v) => sum + v.total, 0),
      fechaInicio,
      fechaFin
    };
  }

  /**
   * Configurar encabezado del PDF
   */
  private setupPDFHeader(doc: jsPDF, titulo: string, subtitulo?: string): void {
    // Fondo del encabezado
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, 210, 45, 'F');
    
    // Logo y título principal en blanco
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text('ParkyFilms', 20, 25);
    
    doc.setFontSize(12);
    doc.text('Panel de Administración', 20, 35);
    
    // Título del reporte
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(titulo, 20, 60);
    
    if (subtitulo) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(subtitulo, 20, 72);
    }
    
    // Información de generación
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    const fechaGeneracion = new Date().toLocaleString('es-ES');
    doc.text(`Generado el: ${fechaGeneracion}`, 20, 85);
    doc.text(`Por: ${this.authService.getCurrentUser()?.nombre || 'Admin'}`, 20, 95);
    
    // Línea separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(20, 100, 190, 100);
  }

  /**
   * Configurar pie de página del PDF
   */
  private setupPDFFooter(doc: jsPDF): void {
    const pageCount = (doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Línea superior del pie
      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(1);
      doc.line(20, 275, 190, 275);
      
      // Información del pie
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('ParkyFilms - Sistema de Gestión Integral', 20, 282);
      doc.text('Reporte Confidencial - Solo para uso interno', 20, 287);
      
      // Página actual
      doc.setTextColor(41, 128, 185);
      doc.text(`Página ${i} de ${pageCount}`, 150, 282);
      
      // Timestamp
      const timestamp = new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      doc.text(`Hora: ${timestamp}`, 150, 287);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================
  
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

  private addActividad(actividad: ActividadReciente): void {
    this.actividadSimulada.unshift(actividad);
    if (this.actividadSimulada.length > 20) {
      this.actividadSimulada = this.actividadSimulada.slice(0, 20);
    }
  }

  isAdminUser(): boolean {
    return this.authService.isAdmin();
  }

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
}