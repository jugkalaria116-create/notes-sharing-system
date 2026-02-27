import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contact.html',
  styleUrls: ['./contact.css'],
  encapsulation: ViewEncapsulation.None
})
export class ContactComponent {

  name = '';
  email = '';
  subject = '';
  message = '';

  constructor(private http: HttpClient) {}

  sendMessage() {
    if (!this.name || !this.email || !this.subject || !this.message) {
      alert('All fields are required');
      return;
    }

    this.http.post('http://localhost:3000/api/users/contact', {
      name: this.name,
      email: this.email,
      subject: this.subject,
      message: this.message
    }).subscribe({
      next: () => {
        alert('Message sent successfully');
        window.location.reload(); // 🔥 page reload
      },
      error: () => alert('Failed to send message')
    });
  }
}
