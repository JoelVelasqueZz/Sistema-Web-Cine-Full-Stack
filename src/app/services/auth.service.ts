import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // 🔗 API Configuration
  private readonly API_URL = 'http://localhost:3000/api';

  // 🔐 Estado de autenticación
  private isAuthenticated: boolean = false;
  private currentUser: Usuario | null = null;
  private authToken: string | null = null;

  // 📡 Observable para el estado de autenticación
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  public authStatus$ = this.authStatusSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🔐 AuthService conectado a API:', this.API_URL);
    this.loadAuthFromStorage();
  }

  // ==================== MÉTODOS DE AUTENTICACIÓN ====================

  /**
   * Registrar nuevo usuario
   */
 register(registroData: RegistroUsuario): Observable<AuthResponse> {
  const body = {
    nombre: registroData.nombre,
    email: registroData.email,
    password: registroData.password,
    confirmarPassword: registroData.confirmarPassword
  };

  return this.http.post<any>(`${this.API_URL}/auth/register`, body).pipe(
    map(response => {
      console.log('🔍 Respuesta de registro:', response);
      
      if (response.success && response.data) {
        this.handleAuthSuccess(response.data);
        return {
          success: true,
          message: response.message || '¡Usuario registrado exitosamente!',
          user: this.convertApiUser(response.data.user)
        };
      }
      throw new Error(response.error || 'Error en el registro');
    }),
    catchError(error => {
      console.error('❌ Error en registro:', error);
      return of({
        success: false,
        message: error.error?.error || error.error?.message || 'Error al registrar usuario'
      });
    })
  );
}

/**
 * Iniciar sesión
 */
login(email: string, password: string): Observable<AuthResponse> {
  const body = { email, password };

  return this.http.post<any>(`${this.API_URL}/auth/login`, body).pipe(
    map(response => {
      console.log('🔍 Respuesta de login:', response);
      
      if (response.success && response.data) {
        this.handleAuthSuccess(response.data);
        return {
          success: true,
          message: response.message || '¡Bienvenido de vuelta!',
          user: this.convertApiUser(response.data.user)
        };
      }
      throw new Error(response.error || 'Credenciales incorrectas');
    }),
    catchError(error => {
      console.error('❌ Error en login:', error);
      return of({
        success: false,
        message: error.error?.error || error.error?.message || 'Error al iniciar sesión'
      });
    })
  );
}

/**
 * Verificar token
 */
verifyToken(): Observable<boolean> {
  const token = this.getToken();
  if (!token) return of(false);

  const headers = this.getAuthHeaders();

  return this.http.get<any>(`${this.API_URL}/auth/verify`, { headers }).pipe(
    map(response => {
      console.log('🔍 Respuesta de verify:', response);
      
      if (response.success && response.data) {
        this.currentUser = this.convertApiUser(response.data.user);
        this.isAuthenticated = true;
        this.updateAuthState();
        return true;
      }
      return false;
    }),
    catchError(error => {
      console.error('❌ Token inválido:', error);
      this.logout();
      return of(false);
    })
  );
}

  /**
   * Cerrar sesión
   */
  logout(): void {
    // Llamar al endpoint de logout (opcional)
    const headers = this.getAuthHeaders();
    this.http.post(`${this.API_URL}/auth/logout`, {}, { headers }).subscribe({
      next: () => console.log('✅ Logout exitoso'),
      error: (error) => console.error('⚠️ Error en logout:', error)
    });

    // Limpiar estado local
    this.clearAuthData();
  }

  /**
   * Cambiar contraseña
   */
  changePassword(currentPassword: string, newPassword: string, confirmNewPassword: string): Observable<boolean> {
    const headers = this.getAuthHeaders();
    const body = {
      currentPassword,
      newPassword,
      confirmNewPassword
    };

    return this.http.post<ApiResponse<any>>(`${this.API_URL}/auth/change-password`, body, { headers }).pipe(
      map(response => {
        if (response.success) {
          console.log('✅ Contraseña cambiada exitosamente');
          return true;
        }
        throw new Error(response.message || 'Error al cambiar contraseña');
      }),
      catchError(error => {
        console.error('❌ Error al cambiar contraseña:', error);
        return of(false);
      })
    );
  }

  // ==================== MÉTODOS DE ESTADO ====================

  /**
   * Verificar si el usuario está logueado
   */
  isLoggedIn(): boolean {
    return this.isAuthenticated && this.currentUser !== null && this.authToken !== null;
  }

  /**
   * Verificar si el usuario es admin
   */
  isAdmin(): boolean {
    return this.isLoggedIn() && this.currentUser?.role === 'admin';
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): Usuario | null {
    return this.currentUser;
  }

  /**
   * Obtener token de autenticación
   */
  getToken(): string | null {
    return this.authToken || localStorage.getItem('auth_token');
  }
  getCurrentUserName(): string {
  return this.currentUser?.nombre || 'Usuario';
}

/**
 * Obtener email del usuario actual
 */
getCurrentUserEmail(): string {
  return this.currentUser?.email || '';
}

/**
 * Obtener avatar del usuario actual
 */
getCurrentUserAvatar(): string {
  return this.currentUser?.avatar || 'https://ui-avatars.com/api/?name=User&background=6c757d&color=fff&size=128';
}

/**
 * Verificar si el usuario es cliente
 */
isCliente(): boolean {
  return this.isLoggedIn() && this.currentUser?.role === 'cliente';
}
  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Manejar éxito de autenticación
   */
  private handleAuthSuccess(authData: AuthData): void {
    this.currentUser = this.convertApiUser(authData.user);
    this.authToken = authData.token || null; // ✅ CORREGIDO
    this.isAuthenticated = true;

    // Guardar en localStorage
    this.saveAuthToStorage();
    
    // Actualizar observables
    this.updateAuthState();

    console.log('✅ Autenticación exitosa:', this.currentUser.nombre);
  }

  /**
   * Convertir usuario de API a formato local
   */
  private convertApiUser(apiUser: any): Usuario {
    return {
      id: apiUser.id,
      nombre: apiUser.nombre,
      email: apiUser.email,
      role: apiUser.role as 'admin' | 'cliente',
      avatar: apiUser.avatar,
      fechaRegistro: apiUser.fecha_registro || apiUser.fechaRegistro,
      isActive: apiUser.is_active !== false // ✅ AGREGADO
    };
  }

  /**
   * Obtener headers con token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    
    if (!token) {
      console.warn('⚠️ No hay token de autenticación');
      return new HttpHeaders();
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Actualizar estado de autenticación en observables
   */
  private updateAuthState(): void {
    this.authStatusSubject.next(this.isAuthenticated);
    this.currentUserSubject.next(this.currentUser);
  }

  /**
   * Guardar datos de autenticación en localStorage
   */
  private saveAuthToStorage(): void {
    try {
      if (this.authToken) {
        localStorage.setItem('auth_token', this.authToken);
      }
      if (this.currentUser) {
        localStorage.setItem('current_user', JSON.stringify(this.currentUser));
      }
      localStorage.setItem('is_authenticated', 'true');
    } catch (error) {
      console.error('❌ Error al guardar datos de auth:', error);
    }
  }

  /**
   * Cargar datos de autenticación desde localStorage
   */
  private loadAuthFromStorage(): void {
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('current_user');
      const isAuth = localStorage.getItem('is_authenticated') === 'true';

      if (token && userStr && isAuth) {
        this.authToken = token;
        this.currentUser = JSON.parse(userStr);
        this.isAuthenticated = true;
        this.updateAuthState();

        // Verificar token con el servidor
        this.verifyToken().subscribe();
      }
    } catch (error) {
      console.error('❌ Error al cargar datos de auth:', error);
      this.clearAuthData();
    }
  }

  /**
   * Limpiar todos los datos de autenticación
   */
  private clearAuthData(): void {
    this.currentUser = null;
    this.authToken = null;
    this.isAuthenticated = false;

    // Limpiar localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('is_authenticated');
    localStorage.removeItem('redirectUrl');

    // Actualizar observables
    this.updateAuthState();

    console.log('🧹 Datos de autenticación limpiados');
  }

  // ==================== MÉTODOS DE COMPATIBILIDAD ====================

  /**
   * Método legacy para compatibilidad con código existente
   */
  loginSync(email: string, password: string): boolean {
    console.warn('⚠️ loginSync() es obsoleto. Usa login() Observable');
    
    this.login(email, password).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('✅ Login exitoso (sync)');
        }
      },
      error: (error) => {
        console.error('❌ Error en login (sync):', error);
      }
    });

    return false; // Siempre retorna false ya que es asíncrono
  }

  // ==================== MÉTODOS PARA ADMIN SERVICE ====================

  /**
   * Obtener todos los usuarios registrados (para AdminService)
   */
  getAllRegisteredUsers(): Usuario[] {
    // Por ahora retorna array con el usuario actual
    // En el futuro conectarías con una API de usuarios
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      return [{ ...currentUser, isActive: true }];
    }
    
    // Usuarios de ejemplo para el admin
    return [
      {
        id: 1,
        nombre: 'Admin Sistema',
        email: 'admin@parkyfilms.com',
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?name=Admin+Sistema&background=FF5722&color=fff&size=128&bold=true',
        fechaRegistro: '2024-01-01',
        isActive: true
      },
      {
        id: 2,
        nombre: 'Usuario Demo',
        email: 'demo@parkyfilms.com',
        role: 'cliente',
        avatar: 'https://ui-avatars.com/api/?name=Usuario+Demo&background=4CAF50&color=fff&size=128&bold=true',
        fechaRegistro: '2024-02-15',
        isActive: true
      }
    ];
  }

  /**
   * Buscar usuario por ID (para AdminService)
   */
  findUserById(userId: number): Usuario | null {
    const usuarios = this.getAllRegisteredUsers();
    return usuarios.find(u => u.id === userId) || null;
  }
}

// ==================== INTERFACES ====================

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  role: 'admin' | 'cliente';
  avatar: string;
  fechaRegistro?: string;
  isActive?: boolean; // ✅ AGREGADO
}

export interface RegistroUsuario {
  nombre: string;
  email: string;
  password: string;
  confirmarPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Usuario;
}

interface AuthData {
  user: any;
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  expiresIn?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}