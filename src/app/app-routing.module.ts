import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MovieListComponent } from './components/movie-list/movie-list.component';
import { MovieDetailComponent } from './components/movie-detail/movie-detail.component';
import { TicketPurchaseComponent } from './components/ticket-purchase/ticket-purchase.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { CheckoutComponent } from './components/checkout/checkout.component';
import { SearchComponent } from './components/search/search.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { SeatSelectionComponent } from './components/seat-selection/seat-selection.component';
import { AuthGuard } from './guards/auth.guard';
import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';
import { ComingSoonDetailComponent } from './components/coming-soon-detail/coming-soon-detail.component';
import { ProfileComponent } from './components/profile/profile.component';
import { FavoritesComponent } from './components/favorites/favorites.component';
import { HistoryComponent } from './components/history/history.component';
import { AdminGuard } from './guards/admin.guard';
import { BarListComponent } from './components/bar-list/bar-list.component';
import { BarDetailComponent } from './components/bar-detail/bar-detail.component';

//IMPORTAR COMPONENTES ADMIN
import { AdminLayoutComponent } from './components/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { AdminMoviesComponent } from './components/admin/admin-movies/admin-movies.component';
import { AdminUsersComponent } from './components/admin/admin-users/admin-users.component';
import { AdminBarComponent } from './components/admin/admin-bar/admin-bar.component';

// 🆕 NUEVOS COMPONENTES DEL SISTEMA DE PUNTOS
import { RewardsComponent } from './components/rewards/rewards.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'movies', component: MovieListComponent },
  { path: 'movie/:id', component: MovieDetailComponent },
  { path: 'ticket-purchase/:id', component: TicketPurchaseComponent },
  { 
    path: 'seat-selection/:movieId/:funcionId/:cantidad', 
    component: SeatSelectionComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'cart', 
    component: ShoppingCartComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'checkout', 
    component: CheckoutComponent,
    canActivate: [AuthGuard]
  },
  { path: 'buscar/:termino', component: SearchComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'coming-soon', component: ComingSoonComponent },
  { path: 'coming-soon/:id', component: ComingSoonDetailComponent },
  
  // 🍿 RUTAS DEL BAR
  { path: 'bar', component: BarListComponent },
  { path: 'bar/:id', component: BarDetailComponent },
  
  // 🆕 NUEVA RUTA: SISTEMA DE RECOMPENSAS
  { 
    path: 'rewards', 
    component: RewardsComponent,
    canActivate: [AuthGuard]
  },
  
  // RUTAS DE PERFIL (PROTEGIDAS)
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'favorites', 
    component: FavoritesComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'history', 
    component: HistoryComponent,
    canActivate: [AuthGuard]
  },

  // 🔥 RUTAS DE ADMINISTRACIÓN (PROTEGIDAS CON AdminGuard)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'movies', component: AdminMoviesComponent },
      { path: 'users', component: AdminUsersComponent },
      // 🍿 Ruta de administración del bar
      { path: 'bar', component: AdminBarComponent }
    ]
  },

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }