import { Component, OnInit } from '@angular/core';
import { AuthService, Usuario } from '../../services/auth.service';
import { UserService, UpdateProfileData, UserStats } from '../../services/user.service';
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

  getAccountAge(): string {
    if (!this.currentUser) return '0 días';
    
    const registroDate = new Date(this.currentUser.fechaRegistro);
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
}