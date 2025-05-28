import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MovieListComponent } from './components/movie-list/movie-list.component';
import { MovieCardComponent } from './components/movie-card/movie-card.component';
import { MovieDetailComponent } from './components/movie-detail/movie-detail.component';
import { TicketPurchaseComponent } from './components/ticket-purchase/ticket-purchase.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { SearchComponent } from './components/search/search.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { SeatSelectionComponent } from './components/seat-selection/seat-selection.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'movies', component: MovieListComponent },
  { path: 'movie/:id', component: MovieDetailComponent },
  { path: 'ticket-purchase/:id', component: TicketPurchaseComponent },
  { 
    path: 'seat-selection/:movieId/:funcionId/:cantidad', 
    component: SeatSelectionComponent,
    canActivate: [AuthGuard]  // ← PROTEGIDA: Requiere login
  },
  { 
    path: 'cart', 
    component: ShoppingCartComponent,
    canActivate: [AuthGuard]  // ← PROTEGIDA: Requiere login
  },
  { 
    path: 'checkout', 
    component: CheckoutComponent,
    canActivate: [AuthGuard]  // ← PROTEGIDA: Requiere login
  },
  { path: 'buscar/:termino', component: SearchComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }