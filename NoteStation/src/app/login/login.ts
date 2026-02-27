import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit {
  showPassword: boolean = false;
  formData = { email: '', password: '' };

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    // Pehle se login hai toh dashboard bhejo
    if (localStorage.getItem('adminToken')) {
      this.router.navigate(['/admin-dashboard']);
    } else if (localStorage.getItem('token')) {
      this.router.navigate(['/client/dashboard']);
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (!this.formData.email || !this.formData.password) {
      alert("Please fill all fields");
      return;
    }

    if (this.formData.email === 'admin@notestation.com') {
      // SIRF ADMIN LOGIN
      this.http.post<any>('http://localhost:3000/api/admin/login', this.formData).subscribe({
        next: (res) => {
          alert("Admin Login Successful!");
          localStorage.setItem('adminToken', res.token);
          this.router.navigate(['/admin-dashboard']);
        },
        error: (err) => alert(err.error.message || "Admin Login Failed")
      });
    } else {
      // SIRF USER LOGIN
      this.http.post<any>('http://localhost:3000/api/users/login', this.formData).subscribe({
        next: (res) => {
          alert("User Login Successful!");
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.router.navigate(['/client/dashboard']);
        },
        error: (err) => alert(err.error.message || "User Login Failed")
      });
    }
  }
}