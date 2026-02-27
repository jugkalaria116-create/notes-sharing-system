import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent {

  userName: string = 'Dharmik';
  currentPage: string = 'dashboard';

  // ✅ FIX: notes properly declared
  notes: { title: string; desc: string }[] = [
    { title: 'Angular Basics', desc: 'Components, Directives, Services' },
    { title: 'PHP CRUD', desc: 'Insert Update Delete' }
  ];

  newNote = {
    title: '',
    desc: ''
  };

  changePage(page: string) {
    this.currentPage = page;
  }

  addNote() {
    if (this.newNote.title && this.newNote.desc) {
      this.notes.push({
        title: this.newNote.title,
        desc: this.newNote.desc
      });

      this.newNote.title = '';
      this.newNote.desc = '';
      this.currentPage = 'notes';
    }
  }
}
