import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const adminAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const adminToken = localStorage.getItem('adminToken');

  if (adminToken) {
    return true; // Token hai, andar jaane do
  } else {
    router.navigate(['/login']); // Token nahi hai, login pe feko
    return false;
  }
};