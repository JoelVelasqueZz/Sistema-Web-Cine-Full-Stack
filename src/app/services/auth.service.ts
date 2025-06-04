import { Injectable } from '@angular/core';

@Injectable({
 providedIn: 'root'
})
export class AuthService {

 private isAuthenticated: boolean = false;
 private currentUser: Usuario | null = null;
 private usuarios: Usuario[] = [
   // 🆕 USUARIOS ACTUALIZADOS CON ROLES
   {
     id: 1,
     nombre: 'Juan Pérez',
     email: 'juan@email.com',
     password: '123456',
     fechaRegistro: '2024-01-15',
     avatar: 'https://ui-avatars.com/api/?name=Juan+Perez&background=4CAF50&color=fff&size=128',
     role: 'cliente', // 🆕 NUEVO
     isActive: true   // 🆕 NUEVO
   },
   {
     id: 2,
     nombre: 'María García',
     email: 'maria@email.com',
     password: 'admin',
     fechaRegistro: '2024-02-10',
     avatar: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=2196F3&color=fff&size=128',
     role: 'admin',   // 🆕 ADMIN
     isActive: true   // 🆕 NUEVO
   },
   // 🆕 AGREGAR OTRO ADMIN PARA PRUEBAS
   {
     id: 3,
     nombre: 'Admin Sistema',
     email: 'admin@parkyfilms.com',
     password: 'admin123',
     fechaRegistro: '2024-01-01',
     avatar: 'https://ui-avatars.com/api/?name=Admin+Sistema&background=FF5722&color=fff&size=128',
     role: 'admin',
     isActive: true
   }
 ];

 constructor() { 
   console.log('Servicio de autenticación listo!');
   // Verificar si hay una sesión guardada
   this.verificarSesionGuardada();
 }

 // LOGIN
 login(email: string, password: string): boolean {
   console.log('Intentando login con:', email);
   
   const usuario = this.usuarios.find(u => 
     u.email === email && u.password === password
   );

   if (usuario) {
     this.isAuthenticated = true;
     this.currentUser = usuario;
     // Guardar sesión en localStorage (opcional)
     localStorage.setItem('currentUser', JSON.stringify(usuario));
     localStorage.setItem('isAuthenticated', 'true');
     console.log('Login exitoso:', usuario.nombre);
     return true;
   } else {
     console.log('Credenciales incorrectas');
     return false;
   }
 }

 loginAndRedirect(email: string, password: string): boolean {
   const loginSuccess = this.login(email, password);
   
   if (loginSuccess) {
     // Obtener URL guardada para redirección
     const redirectUrl = localStorage.getItem('redirectUrl');
     
     if (redirectUrl) {
       // Limpiar URL guardada
       localStorage.removeItem('redirectUrl');
       
       // Redirigir a donde quería ir originalmente
       setTimeout(() => {
         window.location.href = redirectUrl;
       }, 100);
     }
   }
   
   return loginSuccess;
 }

 // 🆕 REGISTRO ACTUALIZADO CON ROLES
 register(datosUsuario: RegistroUsuario): boolean {
   console.log('Registrando nuevo usuario:', datosUsuario);

   // Verificar si el email ya existe
   const emailExiste = this.usuarios.find(u => u.email === datosUsuario.email);
   if (emailExiste) {
     console.log('El email ya está registrado');
     return false;
   }

   // Crear nuevo usuario
   const nuevoUsuario: Usuario = {
     id: this.usuarios.length + 1,
     nombre: datosUsuario.nombre,
     email: datosUsuario.email,
     password: datosUsuario.password,
     fechaRegistro: new Date().toISOString().split('T')[0],
     avatar: this.generarAvatarPorDefecto(datosUsuario.nombre),
     role: 'cliente', // 🆕 TODOS LOS NUEVOS USUARIOS SON CLIENTES
     isActive: true   // 🆕 ACTIVOS POR DEFECTO
   };

   // Agregar a la lista de usuarios
   this.usuarios.push(nuevoUsuario);
   console.log('Usuario registrado exitosamente:', nuevoUsuario);
   return true;
 }

 // LOGOUT
 logout(): void {
   console.log('Cerrando sesión de:', this.currentUser?.nombre);
   this.isAuthenticated = false;
   this.currentUser = null;
   
   // Limpiar localStorage
   localStorage.removeItem('currentUser');
   localStorage.removeItem('isAuthenticated');
 }

 // VERIFICAR SI ESTÁ LOGUEADO
 isLoggedIn(): boolean {
   return this.isAuthenticated;
 }

 // OBTENER USUARIO ACTUAL
 getCurrentUser(): Usuario | null {
   return this.currentUser;
 }

 // OBTENER NOMBRE DEL USUARIO
 getCurrentUserName(): string {
   return this.currentUser ? this.currentUser.nombre : 'Usuario';
 }

 // 🆕 NUEVOS MÉTODOS PARA ROLES
 isAdmin(): boolean {
   return this.currentUser?.role === 'admin' && this.isAuthenticated;
 }

 isCliente(): boolean {
   return this.currentUser?.role === 'cliente' && this.isAuthenticated;
 }

 getCurrentUserRole(): 'admin' | 'cliente' | null {
   return this.currentUser?.role || null;
 }

 // VERIFICAR SESIÓN GUARDADA (al recargar la página)
 private verificarSesionGuardada(): void {
   const isAuth = localStorage.getItem('isAuthenticated');
   const userData = localStorage.getItem('currentUser');

   if (isAuth === 'true' && userData) {
     try {
       this.currentUser = JSON.parse(userData);
       this.isAuthenticated = true;
       console.log('Sesión restaurada para:', this.currentUser?.nombre);
     } catch (error) {
       console.log('Error al restaurar sesión:', error);
       this.logout();
     }
   }
 }

 // MÉTODOS AUXILIARES PARA VALIDACIONES
 emailExiste(email: string): boolean {
   return this.usuarios.some(u => u.email === email);
 }

 validarEmail(email: string): boolean {
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return emailRegex.test(email);
 }

 // MÉTODO PARA GENERAR AVATAR AUTOMÁTICO
 private generarAvatarPorDefecto(nombre: string): string {
   // Limpiar el nombre y tomar las iniciales
   const nombreLimpio = nombre.trim();
   const iniciales = nombreLimpio.split(' ')
     .map(palabra => palabra.charAt(0).toUpperCase())
     .join('')
     .substring(0, 2);
   
   // Colores aleatorios bonitos
   const colores = ['4CAF50', '2196F3', 'FF9800', '9C27B0', 'F44336', '00BCD4', 'FFC107', '795548'];
   const colorAleatorio = colores[Math.floor(Math.random() * colores.length)];
   
   // Generar URL del avatar
   return `https://ui-avatars.com/api/?name=${iniciales}&background=${colorAleatorio}&color=fff&size=128&bold=true`;
 }
 public getAllRegisteredUsers(): Usuario[] {
  return this.usuarios.slice(); // Retorna una copia del array
}

public getUsersCount(): number {
  return this.usuarios.length;
}

public getActiveUsersCount(): number {
  return this.usuarios.filter(u => u.isActive !== false).length;
}

public findUserById(id: number): Usuario | undefined {
  return this.usuarios.find(u => u.id === id);
}
}

// 🆕 INTERFACES ACTUALIZADAS
export interface Usuario {
 id: number;
 nombre: string;
 email: string;
 password: string;
 fechaRegistro: string;
 avatar: string;
 role: 'admin' | 'cliente'; // 🆕 NUEVO CAMPO
 isActive: boolean;          // 🆕 NUEVO CAMPO
}

export interface RegistroUsuario {
 nombre: string;
 email: string;
 password: string;
 confirmarPassword: string;
}