import { Routes } from '@angular/router';

import { HomeComponent } from './home/home';
import { BrowseComponent } from './browse/browse';
import { AboutComponent } from './about/about';
import { ContactComponent } from './contact/contact';
import { LoginComponent } from './login/login';
import { RegisterComponent } from './register/register';
import { DashboardComponent } from './client/dashboard/dashboard';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard';

import { PublicGuard } from './guards/public.guard';
import { DashboardGuard } from './guards/dashboard.guard';
import { adminAuthGuard } from './guards/admin-auth-guard'; // 👈 Naya guard import karo

export const routes: Routes = [
  // 1. PUBLIC ROUTES (Login ke baad band: Home, Login, Register)
  { path: '', component: HomeComponent, canActivate: [PublicGuard] },
  { path: 'login', component: LoginComponent, canActivate: [PublicGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [PublicGuard] },

  // 2. ALWAYS ACCESSIBLE (Login ho ya na ho, notes toh dikhni chahiye!)
  { path: 'browse', component: BrowseComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },

  // 3. CLIENT ROUTES
  {
    path: 'client',
    canActivate: [DashboardGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent }
    ]
  },

  // 4. ADMIN ROUTES
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [adminAuthGuard] 
  },

  { path: '**', redirectTo: '' }
];