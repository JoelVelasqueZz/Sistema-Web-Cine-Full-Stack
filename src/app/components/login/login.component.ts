import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginData = { 
    email: '', 
    password: '' 
  };
  mensajeError = '';      // Mantener para el HTML
  mensajeExito = '';      // Mantener para el HTML  
  mostrarPassword = false;
  recordarSesion = false;
  cargando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  // ✅ MÉTODO CORREGIDO - Ahora usa Observable
  onLogin() {
    this.cargando = true;
    this.mensajeError = '';   
    this.mensajeExito = '';   
    
    // Validaciones básicas
    if (!this.loginData.email.trim()) {
      this.toastService.showWarning('El email es requerido');
      this.cargando = false;
      return;
    }

    if (!this.loginData.password.trim()) {
      this.toastService.showWarning('La contraseña es requerida');
      this.cargando = false;
      return;
    }

    // ✅ USAR EL NUEVO MÉTODO OBSERVABLE
    this.authService.login(this.loginData.email, this.loginData.password).subscribe({
      next: (response) => {
        console.log('🔍 Respuesta de login:', response);
        
        if (response.success) {
          this.toastService.showSuccess(response.message || '¡Bienvenido de vuelta!');
          this.mensajeExito = response.message || '¡Bienvenido de vuelta!';
          
          // Verificar si hay URL de redirección
          const redirectUrl = localStorage.getItem('redirectUrl');
          if (redirectUrl) {
            localStorage.removeItem('redirectUrl');
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1000);
          } else {
            // Redirigir según el rol del usuario
            setTimeout(() => {
              if (response.user?.role === 'admin') {
                this.router.navigate(['/admin']);
              } else {
                this.router.navigate(['/home']);
              }
            }, 1000);
          }
        } else {
          this.toastService.showError(response.message || 'Email o contraseña incorrectos');
          this.mensajeError = response.message || 'Email o contraseña incorrectos';
        }
        
        this.cargando = false;
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        this.toastService.showError('Error de conexión. Intenta de nuevo.');
        this.mensajeError = 'Error de conexión. Intenta de nuevo.';
        this.cargando = false;
      }
    });
  }

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }
}