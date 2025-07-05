import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginData = { 
    email: '', 
    password: '' 
  };
  
  mensajeError = '';
  mensajeExito = '';
  mostrarPassword = false;
  recordarSesion = false;
  cargando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  // ==================== MÉTODOS DE AUTENTICACIÓN TRADICIONAL ====================

  onLogin() {
    this.cargando = true;
    this.limpiarMensajes();
    
    // Validaciones básicas
    if (!this.loginData.email.trim()) {
      this.mostrarError('El email es requerido');
      this.cargando = false;
      return;
    }

    if (!this.loginData.password.trim()) {
      this.mostrarError('La contraseña es requerida');
      this.cargando = false;
      return;
    }

    // Realizar login
    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => {
        console.log('🔍 Respuesta de login:', response);
        
        if (response.success) {
          this.mostrarExito(response.message || '¡Bienvenido de vuelta!');
          this.redirigirUsuario(response.user);
        } else {
          this.mostrarError(response.message || 'Email o contraseña incorrectos');
        }
        
        this.cargando = false;
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        this.mostrarError('Error de conexión. Intenta de nuevo.');
        this.cargando = false;
      }
    });
  }

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // ==================== MÉTODOS DE OAUTH (SOLO GOOGLE Y FACEBOOK) ====================

  /**
   * 🔗 Iniciar autenticación con Google
   */
  loginWithGoogle() {
    if (this.cargando) return;
    
    console.log('🔗 Iniciando login con Google...');
    this.toastService.showInfo('Redirigiendo a Google...');
    
    // Guardar URL de redirección si existe
    this.guardarUrlRedirect();
    
    // Llamar al servicio
    this.authService.loginWithGoogle();
  }

  /**
   * 🔗 Iniciar autenticación con Facebook
   */
  loginWithFacebook() {
    if (this.cargando) return;
    
    console.log('🔗 Iniciando login con Facebook...');
    this.toastService.showInfo('Redirigiendo a Facebook...');
    
    // Guardar URL de redirección si existe
    this.guardarUrlRedirect();
    
    // Llamar al servicio
    this.authService.loginWithFacebook();
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Guardar URL de redirección para después del OAuth
   */
  private guardarUrlRedirect() {
    const redirectUrl = localStorage.getItem('redirectUrl');
    if (redirectUrl) {
      console.log('🔄 URL de redirección ya guardada:', redirectUrl);
    }
  }

  /**
   * Limpiar mensajes de error/éxito
   */
  private limpiarMensajes() {
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  /**
   * Mostrar mensaje de error
   */
  private mostrarError(mensaje: string) {
    this.mensajeError = mensaje;
    this.toastService.showError(mensaje);
  }

  /**
   * Mostrar mensaje de éxito
   */
  private mostrarExito(mensaje: string) {
    this.mensajeExito = mensaje;
    this.toastService.showSuccess(mensaje);
  }

  /**
   * Redirigir usuario después del login exitoso
   */
  private redirigirUsuario(user?: any) {
    // Verificar si hay URL de redirección guardada
    const redirectUrl = localStorage.getItem('redirectUrl');
    
    if (redirectUrl) {
      localStorage.removeItem('redirectUrl');
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    } else {
      // Redirigir según el rol del usuario
      setTimeout(() => {
        if (user?.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/home']);
        }
      }, 1000);
    }
  }

  // ==================== MÉTODOS DE CICLO DE VIDA ====================

  ngOnInit() {
    // Verificar si hay parámetros de error en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      this.mostrarErrorOAuth(error);
    }
  }

  /**
   * Mostrar error de OAuth basado en el parámetro
   */
  private mostrarErrorOAuth(error: string) {
    let mensaje = '';
    
    switch (error) {
      case 'oauth_failed':
        mensaje = 'La autenticación falló. Por favor, inténtalo de nuevo.';
        break;
      case 'oauth_error':
        mensaje = 'Ocurrió un error durante la autenticación. Inténtalo más tarde.';
        break;
      case 'access_denied':
        mensaje = 'Acceso denegado. Has cancelado la autenticación.';
        break;
      default:
        mensaje = 'Error desconocido en la autenticación.';
    }
    
    this.mostrarError(mensaje);
    
    // Limpiar la URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}