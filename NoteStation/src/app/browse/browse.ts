import { Component, ViewEncapsulation, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  templateUrl: './browse.html',
  styleUrls: ['./browse.css'],
  encapsulation: ViewEncapsulation.None
})
export class BrowseComponent implements OnInit {

  allNotes: any[] = [];
  filteredNotes: any[] = [];

  loading: boolean = false;
  searchText: string = "";
  selectedCategory: string = "";

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchAllPublicNotes();
  }

  fetchAllPublicNotes() {
    this.loading = true;

    this.http.get<any>('http://localhost:3000/api/admin/all-notes').subscribe({
      next: (res) => {
        if (res && res.success) {
          const rawNotes = res.notes || [];
          this.allNotes = rawNotes.filter((note: any) => !note.isDeleted);
          this.filteredNotes = [...this.allNotes];
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("HTTP Fetch Error:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters() {
    this.filteredNotes = this.allNotes.filter(note => {

      const matchesText =
        note.title?.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesCategory =
        !this.selectedCategory ||
        note.category === this.selectedCategory;

      return matchesText && matchesCategory;
    });
  }

  getFileIcon(fileName: string): string {
    if (!fileName) return 'fa-file';
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'fa-file-pdf';
      case 'doc':
      case 'docx': return 'fa-file-word';
      case 'jpg':
      case 'jpeg':
      case 'png': return 'fa-file-image';
      default: return 'fa-file-lines';
    }
  }

  getFileColor(fileName: string): string {
    if (!fileName) return '#facc3c';
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '#facc3c';
      case 'doc':
      case 'docx': return '#3498db';
      case 'jpg':
      case 'jpeg':
      case 'png': return '#e74c3c';
      default: return '#2ecc71';
    }
  }

  downloadFile(fileName: string) {
    if (!fileName) return alert("File missing");

    const url = `http://localhost:3000/uploads/${fileName}`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        link.href = objectUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      },
      error: () => {
        window.open(url, '_blank');
      }
    });
  }
}