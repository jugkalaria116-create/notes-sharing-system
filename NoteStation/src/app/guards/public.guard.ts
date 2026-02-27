import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const PublicGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Agar admin logged in hai, toh public pages (Home/Login) band
  if (localStorage.getItem('adminToken')) {
    router.navigate(['/admin-dashboard']);
    return false;
  }

  // Agar user logged in hai, toh public pages band
  if (localStorage.getItem('token')) {
    router.navigate(['/client/dashboard']);
    return false;
  }

  return true; // Login nahi hai toh allow
};