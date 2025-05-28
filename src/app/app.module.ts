import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { HomeComponent } from './components/home/home.component';
import { MovieListComponent } from './components/movie-list/movie-list.component';
import { MovieCardComponent } from './components/movie-card/movie-card.component';
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

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    HomeComponent,
    MovieListComponent,
    MovieCardComponent,
    MovieDetailComponent,
    SearchComponent,
    LoginComponent,     
    RegisterComponent, 
    TicketPurchaseComponent, 
    ShoppingCartComponent, 
    CheckoutComponent, SeatSelectionComponent, ToastComponent   
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
    CartService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }