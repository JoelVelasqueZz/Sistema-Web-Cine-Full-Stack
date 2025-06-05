import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { MovieListComponent } from './components/movie-list/movie-list.component';
import { MovieDetailComponent } from './components/movie-detail/movie-detail.component';
import { SearchComponent } from './components/search/search.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CartService } from './services/cart.service';

// Importar servicios
import { AuthService } from './services/auth.service';
import { TicketPurchaseComponent } from './components/ticket-purchase/ticket-purchase.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { SeatSelectionComponent } from './components/seat-selection/seat-selection.component';
import { ToastComponent } from './components/toast/toast.component';
import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';
import { ComingSoonDetailComponent } from './components/coming-soon-detail/coming-soon-detail.component';
import { EmailService } from './services/email.service';
import { PaypalSimulationService } from './services/paypal-simulation.service';
import { ProfileComponent } from './components/profile/profile.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { HistoryComponent } from './components/history/history.component';
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminMoviesComponent } from './components/admin/admin-movies/admin-movies.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';

import { AdminService } from './services/admin.service';

// 🍿 COMPONENTES DEL BAR
import { BarListComponent } from './components/bar-list/bar-list.component';
import { BarDetailComponent } from './components/bar-detail/bar-detail.component';

// 🍿 SERVICIO DEL BAR
import { BarService } from './services/bar.service';
import { FooterComponent } from './components/footer/footer.component';
import { AdminBarComponent } from './components/admin/admin-bar/admin-bar.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    MovieListComponent,
    MovieDetailComponent,
    SearchComponent,
    LoginComponent,     
    RegisterComponent, 
    TicketPurchaseComponent, 
    ShoppingCartComponent, 
    CheckoutComponent, 
    SeatSelectionComponent, 
    ToastComponent, 
    ComingSoonComponent, 
    ComingSoonDetailComponent, 
    ProfileComponent, 
    FavoritesComponent, 
    HistoryComponent, 
    AdminLayoutComponent, 
    AdminDashboardComponent, 
    AdminMoviesComponent, 
    AdminUsersComponent,
    // 🍿 COMPONENTES DEL BAR
    AdminBarComponent,
    BarListComponent, 
    BarDetailComponent, FooterComponent,   
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule
  ],
  providers: [
    AuthService,
    CartService,
    EmailService,
    PaypalSimulationService,
    AdminService,
    // 🍿 SERVICIO DEL BAR
    BarService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }