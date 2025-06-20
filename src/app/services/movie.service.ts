// movie.service.ts - VERSIÓN COMPLETA CON RECOMENDACIONES
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MovieService {

  // 🔗 API Configuration
  private readonly API_URL = 'http://localhost:3000/api';

  // 🎬 Datos locales para funciones, asientos y próximos estrenos (se migrarán después)
  private funcionesCine: { [peliculaId: number]: FuncionCine[] } = {
    1: [ // Primer película de la BD
      {
        id: 'av2-001',
        fecha: '2024-12-20',
        hora: '14:30',
        sala: 'Sala 1 - IMAX',
        precio: 12.50,
        asientosDisponibles: 45,
        formato: 'IMAX 3D'
      },
      {
        id: 'av2-002',
        fecha: '2024-12-20',
        hora: '17:45',
        sala: 'Sala 2',
        precio: 8.50,
        asientosDisponibles: 32,
        formato: '2D'
      }
    ],
    2: [
      {
        id: 'tg-001',
        fecha: '2024-12-20',
        hora: '16:00',
        sala: 'Sala 3',
        precio: 9.00,
        asientosDisponibles: 38,
        formato: '2D'
      }
    ],
    3: [
      {
        id: 'bp-001',
        fecha: '2024-12-20',
        hora: '15:15',
        sala: 'Sala 4',
        precio: 8.50,
        asientosDisponibles: 42,
        formato: '2D'
      }
    ]
  };

  private proximosEstrenos: ProximoEstreno[] = [
    {
      id: 1,
      idx: 1, // 🆕 AGREGAR idx
      titulo: "Kayara: La Princesa Inca",
      sinopsis: "Una épica aventura que narra la historia de Kayara, una valiente princesa inca que debe salvar su reino de una amenaza ancestral.",
      poster: "assets/movies/kayara.png",
      fechaEstreno: "2025-06-06",
      estudio: "assets/studios/paramount.png",
      genero: "Aventura",
      director: "Carlos López Estrada",
      trailer: "rDX5wVVBW4Y",
      duracion: "2h 10min",
      actores: ["Yalitza Aparicio", "Oscar Isaac", "Stephanie Beatriz", "John Leguizamo"]
    },
    {
      id: 2,
      idx: 2, // 🆕 AGREGAR idx
      titulo: "Elio",
      sinopsis: "Elio, un niño soñador y fanático del espacio, es confundido accidentalmente con el representante intergaláctico de la Tierra.",
      poster: "assets/movies/elio.png",
      fechaEstreno: "2025-06-13",
      estudio: "assets/studios/disney.png",
      genero: "Animación",
      director: "Adrian Molina",
      trailer: "QkA4XR5GUos",
      duracion: "1h 35min",
      actores: ["Yonas Kibreab", "Zoe Saldaña", "Remy Edgerly", "Brad Garrett"]
    }
  ];

  private seatMaps: { [salaId: string]: SeatMap } = {
    'Sala 1 - IMAX': {
      rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      seatsPerRow: 12,
      vipRows: ['E', 'F'],
      disabledSeats: ['A1', 'A12', 'H1', 'H12'],
      occupiedSeats: []
    },
    'Sala 2': {
      rows: ['A', 'B', 'C', 'D', 'E', 'F'],
      seatsPerRow: 10,
      vipRows: ['D', 'E'],
      disabledSeats: [],
      occupiedSeats: ['C5', 'C6', 'D7']
    },
    'default': {
      rows: ['A', 'B', 'C', 'D', 'E', 'F'],
      seatsPerRow: 10,
      vipRows: ['D', 'E'],
      disabledSeats: [],
      occupiedSeats: []
    }
  };

  constructor(private http: HttpClient) {
    console.log('🎬 MovieService conectado a API:', this.API_URL);
  }

  // ==================== MÉTODOS DE RECOMENDACIONES ====================

  /**
   * 🎯 Obtener recomendaciones personalizadas para el usuario
   */
  getRecommendations(): Observable<Pelicula[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/movies/recommendations`, { headers }).pipe(
      map(response => {
        console.log('🎯 Recomendaciones obtenidas:', response.data?.length || 0);
        if (response.meta) {
          console.log('📊 Metadatos de recomendaciones:', {
            algorithm: response.meta.algorithm,
            basedOnPurchases: response.meta.basedOnPurchases,
            userId: response.meta.userId
          });
        }
        return (response.data || []).map(pelicula => this.convertApiToLocal(pelicula));
      }),
      catchError(error => {
        console.error('❌ Error al obtener recomendaciones:', error);
        // Fallback: retornar películas destacadas si falla
        return this.getFallbackRecommendations();
      })
    );
  }

  /**
   * Obtener recomendaciones de fallback (películas destacadas)
   */
  private getFallbackRecommendations(): Observable<Pelicula[]> {
    console.log('🔄 Usando recomendaciones de fallback');
    
    return this.getPeliculas().pipe(
      map(peliculas => {
        // Filtrar y ordenar por rating para fallback
        return peliculas
          .filter(p => p.rating >= 7.0)
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 8);
      })
    );
  }

  /**
   * Verificar si el usuario puede obtener recomendaciones
   */
  canGetRecommendations(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  // ==================== MÉTODOS DE API (PELÍCULAS) ====================

  /**
   * Obtener todas las películas desde la API PostgreSQL
   */
  getPeliculas(): Observable<Pelicula[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/movies`).pipe(
      map(response => {
        console.log('📡 Películas obtenidas de PostgreSQL:', response.data?.length || 0);
        return (response.data || []).map(pelicula => this.convertApiToLocal(pelicula));
      }),
      catchError(error => {
        console.error('❌ Error al obtener películas:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener película por ID
   */
  getPeliculaById(id: number): Observable<Pelicula | null> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/movies/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('📡 Película obtenida:', response.data.titulo);
          return this.convertApiToLocal(response.data);
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Error al obtener película:', error);
        return of(null);
      })
    );
  }

  /**
   * Buscar películas por término
   */
  buscarPeliculas(termino: string): Observable<Pelicula[]> {
    const encodedTerm = encodeURIComponent(termino);
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/movies/search?q=${encodedTerm}`).pipe(
      map(response => {
        console.log(`🔍 Resultados para "${termino}":`, response.data?.length || 0);
        return (response.data || []).map(pelicula => this.convertApiToLocal(pelicula));
      }),
      catchError(error => {
        console.error('❌ Error en búsqueda:', error);
        return of([]);
      })
    );
  }

  /**
   * Agregar nueva película (solo admin)
   */
  addPelicula(peliculaData: Omit<Pelicula, 'id' | 'idx'>): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    // Convertir formato local a formato API
    const apiData = this.convertLocalToApi(peliculaData);
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/movies`, apiData, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Película creada:', response.data?.titulo || 'Sin título');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al crear película:', error);
        return of(false);
      })
    );
  }

  /**
   * Actualizar película existente (solo admin)
   */
  updatePelicula(id: number, peliculaData: Partial<Pelicula>): Observable<boolean> {
    const headers = this.getAuthHeaders();
    const apiData = this.convertLocalToApi(peliculaData);
    
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/movies/${id}`, apiData, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Película actualizada');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al actualizar película:', error);
        return of(false);
      })
    );
  }

  /**
   * Eliminar película (solo admin)
   */
  deletePelicula(id: number): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/movies/${id}`, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Película eliminada');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al eliminar película:', error);
        return of(false);
      })
    );
  }

  // ==================== MÉTODOS DE CONVERSIÓN ====================

  /**
   * Convertir película de API a formato local
   */
  private convertApiToLocal(apiPelicula: any): Pelicula {
    return {
      id: apiPelicula.id,
      titulo: apiPelicula.titulo,
      sinopsis: apiPelicula.sinopsis,
      poster: apiPelicula.poster,
      fechaEstreno: apiPelicula.fecha_estreno,
      estudio: apiPelicula.estudio,
      genero: apiPelicula.genero,
      anio: apiPelicula.anio,
      duracion: apiPelicula.duracion,
      rating: parseFloat(apiPelicula.rating?.toString() || '0'),
      director: apiPelicula.director,
      trailer: apiPelicula.trailer,
      idx: apiPelicula.id // Para compatibilidad
    };
  }

  /**
   * Convertir película de formato local a API
   */
  private convertLocalToApi(localPelicula: any): any {
    return {
      titulo: localPelicula.titulo,
      sinopsis: localPelicula.sinopsis,
      poster: localPelicula.poster,
      fecha_estreno: localPelicula.fechaEstreno,
      estudio: localPelicula.estudio,
      genero: localPelicula.genero,
      anio: localPelicula.anio,
      duracion: localPelicula.duracion,
      rating: localPelicula.rating,
      director: localPelicula.director,
      trailer: localPelicula.trailer
    };
  }

  // ==================== MÉTODOS DE AUTENTICACIÓN ====================

  /**
   * Obtener headers con token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    // 🔍 VERIFICAR el nombre correcto del token en localStorage
    const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠️ No hay token de autenticación');
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==================== RESTO DE MÉTODOS EXISTENTES ====================

  testComingSoonConnection(): void {
    console.log('🧪 Probando conexión a API de próximos estrenos...');
    
    this.http.get<ApiResponse<any[]>>(`${this.API_URL}/coming-soon`).subscribe(
      response => {
        console.log('✅ Conexión exitosa:', response);
        console.log('📊 Datos recibidos:', response.data?.length || 0, 'estrenos');
      },
      error => {
        console.error('❌ Error de conexión:', error);
        console.log('🔧 Verificar:');
        console.log('  - Servidor backend funcionando en', this.API_URL);
        console.log('  - Ruta /coming-soon agregada en routes/index.js');
        console.log('  - CORS configurado para localhost:4200');
      }
    );
  }

  getPelicula(idx: number): Pelicula | null {
    console.warn('⚠️ Método getPelicula() es obsoleto. Usa getPeliculaById()');
    return null;
  }

  getTrailerUrl(pelicula: Pelicula): string {
    if (pelicula && pelicula.trailer) {
      return `https://www.youtube.com/embed/${pelicula.trailer}`;
    }
    return '';
  }

  getProximosEstrenosFromAPI(): Observable<ProximoEstreno[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/coming-soon`).pipe(
      map(response => {
        console.log('📡 Próximos estrenos obtenidos de PostgreSQL:', response.data?.length || 0);
        return (response.data || []).map((estreno, index) => ({
          ...this.convertApiEstrenoToLocal(estreno),
          idx: estreno.id || index // 🆕 AGREGAR idx para compatibilidad
        }));
      }),
      catchError(error => {
        console.error('❌ Error al obtener próximos estrenos:', error);
        // Fallback a datos locales
        console.log('🔄 Usando datos locales como fallback');
        return of(this.proximosEstrenos.map((estreno, index) => ({
          ...estreno,
          idx: estreno.id || index // 🆕 AGREGAR idx también en fallback
        })));
      })
    );
  }

  getProximoEstrenoByIdFromAPI(id: number): Observable<ProximoEstreno | null> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/coming-soon/${id}`).pipe(
      map(response => {
        if (response.success && response.data) {
          console.log('📡 Próximo estreno obtenido:', response.data.titulo);
          return this.convertApiEstrenoToLocal(response.data);
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Error al obtener próximo estreno:', error);
        // Fallback a datos locales
        return of(this.getProximoEstreno(id));
      })
    );
  }

  addProximoEstreno(estrenoData: Omit<ProximoEstreno, 'id'>): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    // Convertir formato local a formato API
    const apiData = this.convertLocalEstrenoToApi(estrenoData);
    
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/coming-soon`, apiData, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Próximo estreno creado:', response.data?.titulo || 'Sin título');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al crear próximo estreno:', error);
        return of(false);
      })
    );
  }

  private convertLocalEstrenoToApi(localEstreno: any): any {
    return {
      titulo: localEstreno.titulo,
      sinopsis: localEstreno.sinopsis,
      poster: localEstreno.poster,
      fecha_estreno: localEstreno.fechaEstreno,
      estudio: localEstreno.estudio,
      genero: localEstreno.genero,
      director: localEstreno.director,
      trailer: localEstreno.trailer,
      duracion: localEstreno.duracion,
      actores: localEstreno.actores || []
    };
  }

  updateProximoEstreno(id: number, estrenoData: Partial<ProximoEstreno>): Observable<boolean> {
    const headers = this.getAuthHeaders();
    const apiData = this.convertLocalEstrenoToApi(estrenoData);
    
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/coming-soon/${id}`, apiData, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Próximo estreno actualizado');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al actualizar próximo estreno:', error);
        return of(false);
      })
    );
  }

  deleteProximoEstreno(id: number): Observable<boolean> {
    const headers = this.getAuthHeaders();
    
    return this.http.delete<ApiResponse<any>>(`${this.API_URL}/coming-soon/${id}`, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Próximo estreno eliminado');
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('❌ Error al eliminar próximo estreno:', error);
        return of(false);
      })
    );
  }

  buscarProximosEstrenos(termino: string): Observable<ProximoEstreno[]> {
    if (!termino.trim()) {
      return of([]);
    }

    const encodedTerm = encodeURIComponent(termino);
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/coming-soon/search?q=${encodedTerm}`).pipe(
      map(response => {
        console.log(`🔍 Próximos estrenos encontrados para "${termino}":`, response.data?.length || 0);
        return (response.data || []).map(estreno => this.convertApiEstrenoToLocal(estreno));
      }),
      catchError(error => {
        console.error('❌ Error en búsqueda de próximos estrenos:', error);
        return of([]);
      })
    );
  }

  private convertApiEstrenoToLocal(apiEstreno: any): ProximoEstreno {
    return {
      id: apiEstreno.id,
      idx: apiEstreno.id, // 🆕 AGREGAR idx
      titulo: apiEstreno.titulo,
      sinopsis: apiEstreno.sinopsis,
      poster: apiEstreno.poster,
      fechaEstreno: apiEstreno.fecha_estreno,
      estudio: apiEstreno.estudio,
      genero: apiEstreno.genero,
      director: apiEstreno.director,
      trailer: apiEstreno.trailer,
      duracion: apiEstreno.duracion,
      actores: apiEstreno.actores || []
    };
  }

  getProximosEstrenos(): ProximoEstreno[] {
    // Este método sigue siendo síncrono para compatibilidad
    // Para nuevos desarrollos, usar getProximosEstrenosFromAPI()
    console.log('⚠️ Usando datos locales. Para API usa getProximosEstrenosFromAPI()');
    return this.proximosEstrenos
      .map((estreno, index) => ({
        ...estreno,
        idx: estreno.id || index // 🆕 AGREGAR idx para compatibilidad
      }))
      .sort((a, b) => {
        return new Date(a.fechaEstreno).getTime() - new Date(b.fechaEstreno).getTime();
      });
  }

  getProximosEstrenosHybrid(): Observable<ProximoEstreno[]> {
    return this.getProximosEstrenosFromAPI().pipe(
      catchError(() => {
        console.log('🔄 API no disponible, usando datos locales');
        return of(this.getProximosEstrenos());
      })
    );
  }

  validateProximoEstrenoData(estreno: Partial<ProximoEstreno>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!estreno.titulo?.trim()) errors.push('El título es requerido');
    if (!estreno.director?.trim()) errors.push('El director es requerido');
    if (!estreno.sinopsis?.trim()) errors.push('La sinopsis es requerida');
    if (!estreno.genero?.trim()) errors.push('El género es requerido');
    if (!estreno.poster?.trim()) errors.push('La URL del poster es requerida');
    if (!estreno.fechaEstreno?.trim()) errors.push('La fecha de estreno es requerida');
    
    // Validar que la fecha sea futura
    if (estreno.fechaEstreno) {
      const fechaEstreno = new Date(estreno.fechaEstreno);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaEstreno < hoy) {
        errors.push('La fecha de estreno debe ser futura');
      }
    }

    // Validar trailer de YouTube
    if (estreno.trailer && !/^[a-zA-Z0-9_-]{11}$/.test(estreno.trailer)) {
      errors.push('El trailer debe ser un ID válido de YouTube (11 caracteres)');
    }

    return { valid: errors.length === 0, errors };
  }

  getProximoEstreno(id: number): ProximoEstreno | null {
    const estreno = this.proximosEstrenos.find(estreno => estreno.id === id);
    if (estreno) {
      return {
        ...estreno,
        idx: estreno.id // 🆕 AGREGAR idx
      };
    }
    return null;
  }

  getFuncionesPelicula(peliculaId: number): FuncionCine[] {
    return this.funcionesCine[peliculaId] || [];
  }

  getFuncion(funcionId: string): FuncionCine | undefined {
    for (const peliculaId in this.funcionesCine) {
      const funcion = this.funcionesCine[peliculaId].find(f => f.id === funcionId);
      if (funcion) return funcion;
    }
    return undefined;
  }

  getSeatMap(salaName: string): SeatMap {
    return this.seatMaps[salaName] || this.seatMaps['default'];
  }

  generateSeatsForFunction(funcionId: string): Seat[] {
    const funcion = this.getFuncion(funcionId);
    if (!funcion) return [];

    const seatMap = this.getSeatMap(funcion.sala);
    const seats: Seat[] = [];

    seatMap.rows.forEach(row => {
      for (let seatNumber = 1; seatNumber <= seatMap.seatsPerRow; seatNumber++) {
        const seatId = `${row}${seatNumber}`;
        const isVip = seatMap.vipRows.includes(row);
        const isDisabled = seatMap.disabledSeats.includes(seatId);
        const isOccupied = seatMap.occupiedSeats.includes(seatId);

        seats.push({
          id: seatId,
          row: row,
          number: seatNumber,
          isVip: isVip,
          isDisabled: isDisabled,
          isOccupied: isOccupied,
          isSelected: false,
          price: isVip ? funcion.precio * 1.5 : funcion.precio
        });
      }
    });

    return seats;
  }

  updateOccupiedSeats(funcionId: string, seatIds: string[]): void {
    const funcion = this.getFuncion(funcionId);
    if (!funcion) return;

    const seatMap = this.getSeatMap(funcion.sala);
    seatMap.occupiedSeats = [...seatMap.occupiedSeats, ...seatIds];
  }

  addFuncionToPelicula(peliculaIndex: number, funcion: Omit<FuncionCine, 'id'>): boolean {
    try {
      const funcionId = `func-${Date.now()}`;
      const nuevaFuncion: FuncionCine = { ...funcion, id: funcionId };

      if (!this.funcionesCine[peliculaIndex]) {
        this.funcionesCine[peliculaIndex] = [];
      }

      this.funcionesCine[peliculaIndex].push(nuevaFuncion);
      console.log('✅ Función agregada exitosamente');
      return true;
    } catch (error) {
      console.error('❌ Error al agregar función:', error);
      return false;
    }
  }

  deleteFuncion(funcionId: string): boolean {
    try {
      for (const peliculaId in this.funcionesCine) {
        const funciones = this.funcionesCine[peliculaId];
        const funcionIndex = funciones.findIndex(f => f.id === funcionId);
        
        if (funcionIndex !== -1) {
          funciones.splice(funcionIndex, 1);
          console.log('✅ Función eliminada exitosamente');
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Error al eliminar función:', error);
      return false;
    }
  }

  // ==================== VALIDACIÓN ====================

  validatePeliculaData(pelicula: Partial<Pelicula>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pelicula.titulo?.trim()) errors.push('El título es requerido');
    if (!pelicula.director?.trim()) errors.push('El director es requerido');
    if (!pelicula.sinopsis?.trim()) errors.push('La sinopsis es requerida');
    if (!pelicula.genero?.trim()) errors.push('El género es requerido');
    if (!pelicula.anio || pelicula.anio < 1900 || pelicula.anio > new Date().getFullYear() + 5) {
      errors.push('El año debe ser válido');
    }
    if (!pelicula.rating || pelicula.rating < 0 || pelicula.rating > 10) {
      errors.push('El rating debe estar entre 0 y 10');
    }
    if (!pelicula.poster?.trim()) errors.push('La URL del poster es requerida');
    if (!pelicula.fechaEstreno?.trim()) errors.push('La fecha de estreno es requerida');
    if (!pelicula.duracion?.trim()) errors.push('La duración es requerida');

    return { valid: errors.length === 0, errors };
  }
}

// ==================== INTERFACES ====================

export interface Pelicula {
  id?: number;          // ID de la base de datos
  idx?: number;         // Para compatibilidad con código existente
  titulo: string;
  sinopsis: string;
  poster: string;
  fechaEstreno: string;
  estudio: string;
  genero: string;
  anio: number;
  duracion: string;
  rating: number;
  director: string;
  trailer?: string;
}

export interface FuncionCine {
  id: string;
  fecha: string;
  hora: string;
  sala: string;
  precio: number;
  asientosDisponibles: number;
  formato: string;
}

export interface SeatMap {
  rows: string[];
  seatsPerRow: number;
  vipRows: string[];
  disabledSeats: string[];
  occupiedSeats: string[];
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  isVip: boolean;
  isDisabled: boolean;
  isOccupied: boolean;
  isSelected: boolean;
  price: number;
}

export interface ProximoEstreno {
  id?: number;          // 🆕 Hacer opcional para nuevos registros
  idx?: number;         // 🆕 AGREGAR para compatibilidad
  titulo: string;
  sinopsis: string;
  poster: string;
  fechaEstreno: string;
  estudio: string;
  genero: string;
  director: string;
  trailer: string;
  duracion: string;
  actores: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  total?: number;
  message?: string;
  error?: string;
  meta?: any; // Permite que la respuesta tenga un campo meta opcional
}