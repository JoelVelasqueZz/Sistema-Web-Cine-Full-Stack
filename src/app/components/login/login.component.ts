import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service'; // ← AGREGAR IMPORT

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
  mensajeError = '';      // ← Mantener para el HTML
  mensajeExito = '';      // ← Mantener para el HTML  
  mostrarPassword = false;
  recordarSesion = false;
  cargando = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService // ← AGREGAR AQUÍ
  ) {}

  onLogin() {
    this.cargando = true;
    this.mensajeError = '';   // Limpiar mensaje anterior
    this.mensajeExito = '';   // Limpiar mensaje anterior
    
    if (this.authService.login(this.loginData.email, this.loginData.password)) {
      // ✅ CAMBIO: Toast de éxito
      this.toastService.showSuccess('¡Bienvenido de vuelta!');
      
      // Verificar si hay URL de redirección
      const redirectUrl = localStorage.getItem('redirectUrl');
      if (redirectUrl) {
        // Limpiar URL guardada
        localStorage.removeItem('redirectUrl');
        // Redirigir después de un momento
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);
      } else {
        // Ir a home si no hay redirección
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1000);
      }
    } else {
      // ✅ CAMBIO: Toast de error
      this.toastService.showError('Email o contraseña incorrectos');
      this.cargando = false;
    }
  }

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }
}