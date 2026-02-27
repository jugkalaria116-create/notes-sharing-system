import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class DashboardGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');

    // ❌ login nahi hai
    if (!token) {
      this.router.navigate(['/']);
      return false;
    }

    // ✅ login hai
    return true;
  }
}
