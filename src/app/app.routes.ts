import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Qr } from './pages/qr/qr';
import { Places } from './pages/places/places';
import { Login } from './pages/login/login';
import { AuthCallback } from './pages/auth-callback/auth-callback';
import { Admin } from './pages/admin/admin';
import { Member } from './pages/member/member';
import { Register } from './pages/register/register';
import { authGuard } from './core/guards/auth.guard';
import { activeGuard } from './core/guards/active.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'auth/callback', component: AuthCallback },
  { path: 'member/:id', component: Member },
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'qr', component: Qr, canActivate: [activeGuard] },
  { path: 'places', component: Places, canActivate: [activeGuard] },
  { path: 'admin', component: Admin, canActivate: [adminGuard] },
];
