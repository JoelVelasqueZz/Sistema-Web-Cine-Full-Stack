// src/app/services/logs.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ActivityLog {
  tipo: string;
  descripcion: string;
  fecha: string;
  icono: string;
  color: string;
}

export interface OrderLog {
  id: string;
  total: number;
  estado: string;
  nombre_cliente: string;
  email_cliente: string;
  metodo_pago: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  color_estado: string;
}

export interface UserLog {
  id: number;
  nombre: string;
  email: string;
  role: string;
  is_active: boolean;
  fecha_registro: string;
  color_estado: string;
}

export interface ErrorLog {
  id: number;
  tipo: string;
  mensaje: string;
  timestamp: string;
  nivel: string;
  modulo: string;
}

export interface SystemStats {
  usuarios_activos: number;
  ordenes_hoy: number;
  ordenes_pendientes: number;
  ingresos_hoy: number;
  peliculas_activas: number;
  funciones_activas: number;
}

@Injectable({
  providedIn: 'root'
})
export class LogsService {
  private apiUrl = `${environment.apiUrl}/logs`;

  constructor(private http: HttpClient) {
    console.log('📋 LogsService conectado a API:', this.apiUrl);
  }

  // Método para obtener headers con autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Obtener actividad reciente
  getRecentActivity(limit: number = 50, offset: number = 0): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/activity?limit=${limit}&offset=${offset}`, { headers });
  }

  // Obtener logs de órdenes
  getOrderLogs(limit: number = 20): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/orders?limit=${limit}`, { headers });
  }

  // Obtener logs de usuarios
  getUserLogs(limit: number = 20): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/users?limit=${limit}`, { headers });
  }

  // Obtener logs de errores
  getErrorLogs(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/errors`, { headers });
  }

  // Obtener estadísticas del sistema
  getSystemStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/stats`, { headers });
  }
}