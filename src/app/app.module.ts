import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { MovieListComponent } from './components/movie-list/movie-list.component';
import { MovieDetailComponent } from './components/movie-detail/movie-detail.component';
import { SearchComponent } from './components/search/search.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';

// Importar servicios
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { EmailService } from './services/email.service';
import { PaypalSimulationService } from './services/paypal-simulation.service';
import { AdminService } from './services/admin.service';
import { BarService } from './services/bar.service';
import { FunctionService } from './services/function.service';
import { OrderService } from './services/order.service';
// 🆕 NUEVOS SERVICIOS
import { PointsService } from './services/points.service';
import { RewardsService } from './services/rewards.service';
import { UserService } from './services/user.service';
import { ToastService } from './services/toast.service';

// Componentes principales
import { TicketPurchaseComponent } from './components/ticket-purchase/ticket-purchase.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { SeatSelectionComponent } from './components/seat-selection/seat-selection.component';
import { ToastComponent } from './components/toast/toast.component';
import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';
import { ComingSoonDetailComponent } from './components/coming-soon-detail/coming-soon-detail.component';
import { ProfileComponent } from './components/profile/profile.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { HistoryComponent } from './components/history/history.component';

// Componentes de Admin
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminMoviesComponent } from './components/admin/admin-movies/admin-movies.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminBarComponent } from './components/admin/admin-bar/admin-bar.component';
// 🆕 ADMIN REWARDS COMPONENT (normal, no standalone)
import { AdminRewardsComponent } from './components/admin/admin-rewards/admin-rewards.component';

// 🍿 COMPONENTES DEL BAR
import { BarListComponent } from './components/bar-list/bar-list.component';
import { BarDetailComponent } from './components/bar-detail/bar-detail.component';

// 🎬 COMPONENTES DE FUNCIONES
import { FunctionAdminComponent } from './components/admin/function-admin/function-admin.component';
import { FunctionListComponent } from './components/function-list/function-list.component';
import { FunctionDetailComponent } from './components/function-detail/function-detail.component';

// 🆕 COMPONENTES DEL SISTEMA DE PUNTOS Y RECOMPENSAS (NO standalone)
import { RewardsComponent } from './components/rewards/rewards.component';
import { OrderHistoryComponent } from './components/order-history/order-history.component';
import { PointsHistoryComponent } from './components/points-history/points-history.component';

import { FooterComponent } from './components/footer/footer.component';

// 🎬 COMPONENTES STANDALONE (van en imports)
import { AdminComingSoonComponent } from './components/admin/admin-coming-soon/admin-coming-soon.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';

@NgModule({
  declarations: [
    // Componente principal
    AppComponent,
    
    // Componentes de navegación y layout
    NavbarComponent,
    FooterComponent,
    ToastComponent,
    
    // Componentes principales
    HomeComponent,
    MovieListComponent,
    MovieDetailComponent,
    SearchComponent,
    
    // Componentes de autenticación
    LoginComponent,     
    RegisterComponent, 
    
    // Componentes de compra
    TicketPurchaseComponent, 
    ShoppingCartComponent, 
    CheckoutComponent, 
    SeatSelectionComponent, 
    
    // Componentes de películas y estrenos
    ComingSoonComponent, 
    ComingSoonDetailComponent, 
    
    // Componentes de usuario
    ProfileComponent, 
    FavoritesComponent, 
    HistoryComponent, 
    
    // 🆕 COMPONENTES DEL SISTEMA DE PUNTOS
    OrderHistoryComponent,
    PointsHistoryComponent,
    RewardsComponent,
    
    // 🍿 COMPONENTES DEL BAR
    BarListComponent, 
    BarDetailComponent, 
    
    // 🎬 COMPONENTES DE FUNCIONES
    FunctionListComponent,
    FunctionDetailComponent,
    
    // Componentes de administración
    AdminLayoutComponent, 
    AdminDashboardComponent, 
    AdminMoviesComponent, 
    AdminUsersComponent,
    AdminBarComponent,
    FunctionAdminComponent,
    // 🆕 ADMIN REWARDS COMPONENT (movido aquí correctamente)
    AdminRewardsComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent
  ],
  imports: [
    // Módulos de Angular
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    
    // 🎬 COMPONENTES STANDALONE
    AdminComingSoonComponent
  ],
  providers: [
    // Servicios de autenticación y usuario
    AuthService,
    UserService,
    
    // Servicios de compra y carrito
    CartService,
    OrderService,
    
    // 🆕 SERVICIOS DEL SISTEMA DE PUNTOS
    PointsService,
    RewardsService,
    
    // Servicios de comunicación
    EmailService,
    PaypalSimulationService,
    ToastService,
    
    // Servicios de datos
    AdminService,
    BarService,
    FunctionService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }