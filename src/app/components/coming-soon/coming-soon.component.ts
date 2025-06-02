import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MovieService } from '../../services/movie.service';

@Component({
  selector: 'app-coming-soon',
  standalone: false,
  templateUrl: './coming-soon.component.html',
  styleUrls: ['./coming-soon.component.css']
})
export class ComingSoonComponent implements OnInit {
  
  estrenos: ProximoEstreno[] = [];
  estrenosPorMes: { [mes: string]: ProximoEstreno[] } = {};
  mesesOrdenados: string[] = [];

  constructor(
    private movieService: MovieService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEstrenos();
  }

  cargarEstrenos(): void {
    this.estrenos = this.movieService.getProximosEstrenos();
    this.organizarPorMes();
  }

  organizarPorMes(): void {
    this.estrenosPorMes = {};
    
    this.estrenos.forEach(estreno => {
      const fecha = new Date(estreno.fechaEstreno);
      const mes = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1);
      
      if (!this.estrenosPorMes[mesCapitalizado]) {
        this.estrenosPorMes[mesCapitalizado] = [];
      }
      
      this.estrenosPorMes[mesCapitalizado].push(estreno);
    });
    
    // Ordenar los meses cronológicamente
    this.mesesOrdenados = Object.keys(this.estrenosPorMes).sort((a, b) => {
      const fechaA = new Date(this.estrenosPorMes[a][0].fechaEstreno);
      const fechaB = new Date(this.estrenosPorMes[b][0].fechaEstreno);
      return fechaA.getTime() - fechaB.getTime();
    });
  }

  verDetalles(estreno: ProximoEstreno): void {
    // Navegar a una página de detalles específica para estrenos
    this.router.navigate(['/coming-soon', estreno.id]);
  }

  formatearFecha(fecha: string): string {
    const fechaObj = new Date(fecha);
    return fechaObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getDiasRestantes(fecha: string): number {
    const fechaEstreno = new Date(fecha);
    const hoy = new Date();
    const diferencia = fechaEstreno.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  getColorPorGenero(genero: string): string {
    const colores: { [key: string]: string } = {
      'Acción': 'danger',
      'Aventura': 'success',
      'Comedia': 'warning',
      'Drama': 'info',
      'Terror': 'dark',
      'Ciencia Ficción': 'primary',
      'Animación': 'success',
      'Romance': 'danger'
    };
    return colores[genero] || 'secondary';
  }
}

export interface ProximoEstreno {
  id: number;
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