import { Component, OnInit } from '@angular/core';
import { AuthService, Usuario } from '../../services/auth.service';
import { UserService, UpdateProfileData, UserStats } from '../../services/user.service';
import { PointsService, PointsStats } from '../../services/points.service'; // 🆕 NUEVO
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  
  currentUser: Usuario | null = null;
  userStats: UserStats | null = null;
  pointsStats: PointsStats | null = null; // 🆕 NUEVO
  editMode: boolean = false;
  
  // Datos del formulario de edición
  profileForm: UpdateProfileData = {
    nombre: '',
    email: '',
    avatar: ''
  };
  
  // Control de estados
  loading: boolean = false;
  showAvatarOptions: boolean = false;
  
  // 🆕 NUEVAS PROPIEDADES PARA PUNTOS Y REFERIDOS
  userPoints: number = 0;
  referralCode: string = '';
  showReferralCode: boolean = false;
  copyingCode: boolean = false;
  
  // Opciones de avatares predefinidos
  avatarOptions: string[] = [
    'https://ui-avatars.com/api/?name=User&background=4CAF50&color=fff&size=128',
    'https://ui-avatars.com/api/?name=User&background=2196F3&color=fff&size=128',
    'https://ui-avatars.com/api/?name=User&background=FF9800&color=fff&size=128',
    'https://ui-avatars.com/api/?name=User&background=9C27B0&color=fff&size=128',
    'https://ui-avatars.com/api/?name=User&background=F44336&color=fff&size=128',
    'https://ui-avatars.com/api/?name=User&background=00BCD4&color=fff&size=128'
  ];

  constructor(
    public  authService: AuthService,
    private userService: UserService,
    private pointsService: PointsService, // 🆕 NUEVO
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      // Cargar estadísticas del usuario
      this.userStats = this.userService.getUserStats(this.currentUser.id);
      
      // 🆕 CARGAR ESTADÍSTICAS DE PUNTOS
      this.pointsStats = this.pointsService.getUserPointsStats(this.currentUser.id);
      this.userPoints = this.pointsService.getUserPoints(this.currentUser.id);
      
      // 🆕 OBTENER CÓDIGO DE REFERIDO
      this.referralCode = this.pointsService.getUserReferralCode(this.currentUser.id);
      
      // 🆕 DAR PUNTOS DE BIENVENIDA SI ES NUEVO USUARIO
      this.pointsService.giveWelcomePoints(this.currentUser.id);
      
      // Inicializar formulario con datos actuales
      this.profileForm = {
        nombre: this.currentUser.nombre,
        email: this.currentUser.email,
        avatar: this.currentUser.avatar
      };
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    
    if (!this.editMode) {
      // Si cancela la edición, restaurar datos originales
      this.loadUserData();
    }
  }

  selectAvatar(avatarUrl: string): void {
    this.profileForm.avatar = avatarUrl;
    this.showAvatarOptions = false;
  }

  saveProfile(): void {
    if (!this.currentUser) return;
    
    this.loading = true;
    
    // Validaciones básicas
    if (!this.profileForm.nombre?.trim()) {
      this.toastService.showWarning('El nombre es requerido');
      this.loading = false;
      return;
    }
    
    if (!this.profileForm.email?.trim()) {
      this.toastService.showWarning('El email es requerido');
      this.loading = false;
      return;
    }

    // Simular guardado (en un proyecto real, aquí harías la petición al backend)
    setTimeout(() => {
      if (this.userService.updateProfile(this.currentUser!.id, this.profileForm)) {
        // Actualizar datos en AuthService (simulado)
        this.updateCurrentUser();
        
        this.toastService.showSuccess('Perfil actualizado correctamente');
        this.editMode = false;
        this.loadUserData();
      } else {
        this.toastService.showError('Error al actualizar el perfil');
      }
      
      this.loading = false;
    }, 1000);
  }

  private updateCurrentUser(): void {
    // En un proyecto real, esto se haría automáticamente al recargar desde el backend
    if (this.currentUser) {
      this.currentUser.nombre = this.profileForm.nombre || this.currentUser.nombre;
      this.currentUser.email = this.profileForm.email || this.currentUser.email;
      this.currentUser.avatar = this.profileForm.avatar || this.currentUser.avatar;
      
      // Actualizar en localStorage
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
  }
isLoggedIn(): boolean {
  return this.authService.isLoggedIn();
}

/**
 * Verificar si el usuario es cliente
 */
isCliente(): boolean {
  return this.isLoggedIn() && this.currentUser?.role === 'cliente';
}

/**
 * Verificar si el usuario es admin  
 */
isAdmin(): boolean {
  return this.authService.isAdmin();
}
  getAccountAge(): string {
    if (!this.currentUser || !this.currentUser.fechaRegistro) return '0 días';
    
    const registroDate = new Date(this.currentUser.fechaRegistro as string);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - registroDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} días`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    }
  }

  // 🆕 NUEVOS MÉTODOS PARA SISTEMA DE PUNTOS Y REFERIDOS

  /**
   * Mostrar/ocultar código de referido
   */
  toggleReferralCode(): void {
    this.showReferralCode = !this.showReferralCode;
  }

  /**
   * Copiar código de referido al portapapeles
   */
  copyReferralCode(): void {
    this.copyingCode = true;
    
    navigator.clipboard.writeText(this.referralCode).then(() => {
      this.toastService.showSuccess('¡Código copiado al portapapeles!');
      this.copyingCode = false;
    }).catch(() => {
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = this.referralCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.toastService.showSuccess('¡Código copiado al portapapeles!');
      this.copyingCode = false;
    });
  }

  /**
   * Compartir código de referido
   */
  shareReferralCode(): void {
    const shareText = `¡Únete a CinemaApp con mi código de referido y obtén puntos gratis! 🎬🍿\n\nCódigo: ${this.referralCode}\n\n¡Disfruta del mejor cine!`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Código de Referido - CinemaApp',
        text: shareText,
        url: window.location.origin
      }).then(() => {
        this.toastService.showSuccess('Código compartido exitosamente');
      }).catch(() => {
        this.fallbackShare(shareText);
      });
    } else {
      this.fallbackShare(shareText);
    }
  }

  /**
   * Fallback para compartir en navegadores sin Web Share API
   */
  private fallbackShare(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.showSuccess('Mensaje de referido copiado al portapapeles');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.toastService.showSuccess('Mensaje de referido copiado al portapapeles');
    });
  }

  /**
   * Obtener valor en dólares de los puntos
   */
  getPointsValue(): number {
    return this.pointsService.getPointsValue(this.userPoints);
  }

  /**
   * Obtener configuración de puntos para mostrar información
   */
  getPointsConfig() {
    return this.pointsService.getPointsConfig();
  }

  /**
   * Formatear fecha para mostrar
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Obtener puntos necesarios para la próxima recompensa
   */
  getNextRewardPoints(): number {
    // Esto podría integrarse con RewardsService en el futuro
    const commonRewards = [200, 300, 450, 650, 850];
    const nextReward = commonRewards.find(points => points > this.userPoints);
    return nextReward || 1000;
  }

  /**
   * Obtener progreso hacia la próxima recompensa
   */
  getProgressToNextReward(): number {
    const nextReward = this.getNextRewardPoints();
    return Math.round((this.userPoints / nextReward) * 100);
  }

  /**
   * Navegar a la página de recompensas
   */
  goToRewards(): void {
    // Aquí navegarías a la página de recompensas cuando la implementes
    this.toastService.showInfo('Próximamente: Centro de Recompensas');
  }

  /**
   * Navegar al historial de puntos
   */
  goToPointsHistory(): void {
    // Aquí navegarías al historial de puntos cuando lo implementes
    this.toastService.showInfo('Próximamente: Historial de Puntos');
  }

  /**
   * Obtener información sobre cómo ganar más puntos
   */
  showEarnPointsInfo(): void {
    const config = this.getPointsConfig();
    const message = `💰 ¿Cómo ganar puntos?\n\n` +
                   `🎬 Por cada dólar que gastes: ${config.puntosPorDolar} punto\n` +
                   `👥 Por cada amigo que refiera: ${config.puntosReferido} puntos\n` +
                   `🎁 Puntos de bienvenida: ${config.puntosBienvenida} puntos\n\n` +
                   `¡Compra entradas y productos del bar para acumular puntos!`;
    
    alert(message);
  }
}