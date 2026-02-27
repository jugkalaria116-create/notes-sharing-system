import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  encapsulation: ViewEncapsulation.None
})
export class RegisterComponent {

  showPassword = false;

  formData = {
    firstName: '',
    username: '',
    email: '',
    password: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  register() {

    if (
      !this.formData.firstName ||
      !this.formData.username ||
      !this.formData.email ||
      !this.formData.password
    ) {
      alert('All fields are required');
      return;
    }

    this.http.post<any>(
      'http://localhost:3000/api/users/register',
      {
        firstName: this.formData.firstName,
        username: this.formData.username,
        email: this.formData.email,
        password: this.formData.password
      }
    ).subscribe({
      next: (res) => {
        alert(res?.message || 'Registration successful');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert(err?.error?.message || 'Registration failed');
      }
    });
  }
}