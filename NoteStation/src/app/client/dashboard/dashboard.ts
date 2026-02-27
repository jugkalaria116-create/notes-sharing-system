import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core'; // ChangeDetectorRef add kiya
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {

  userName = '';
  email = '';
  userId = '';
  currentPage = 'dashboard';

  currentPassword = '';
  newPassword = '';
  profileImageUrl: string | null = null;
  selectedProfileFile: File | null = null;
  selectedProfileName: string = ''; 

  selectedCategoryName: string = '';

  totalNotes = 0;
  trashCount = 0;
  allNotes: any[] = [];
  recentNotes: any[] = [];

  searchText: string = '';
  selectedFile: File | null = null; 
  fileName = '';
  noteTitle = '';
  category = '';

  private apiUrl = 'http://localhost:3000/api/users';

  // Constructor mein cdr add kiya
  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (userData && token) {
      const user = JSON.parse(userData);
      this.userName = user.firstName || '';
      this.email = user.email || '';
      this.userId = user.id || user._id;

      if (user.profileImage) {
        this.profileImageUrl = `http://localhost:3000/uploads/${user.profileImage}`;
      }
      this.fetchUserNotes();
    } else {
      this.logout();
    }
  }

  onProfileImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedProfileFile = file;
      this.selectedProfileName = file.name; 
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImageUrl = e.target.result;
        this.cdr.detectChanges(); // UI refresh
      };
      reader.readAsDataURL(file);
    }
  }

  updateProfile() {
    if (!this.userName.trim() || !this.currentPassword.trim()) {
      alert("Full Name and Current Password are required!");
      return;
    }
    const formData = new FormData();
    formData.append('userId', this.userId);
    formData.append('firstName', this.userName);
    formData.append('currentPassword', this.currentPassword);
    if (this.newPassword) formData.append('newPassword', this.newPassword);
    if (this.selectedProfileFile) formData.append('profileImage', this.selectedProfileFile);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.post(`${this.apiUrl}/update-profile`, formData, { headers }).subscribe({
      next: (res: any) => {
        alert("Profile updated successfully! Please login again.");
        localStorage.clear();
        this.router.navigate(['/']); 
      },
      error: (err) => alert(err.error.message || "Update failed.")
    });
  }

  changePage(page: string) {
    this.currentPage = page;
    this.selectedCategoryName = '';
    this.refreshStats();
  }

  viewCategory(catName: string) {
    this.selectedCategoryName = catName;
    this.currentPage = 'category-detail';
    this.cdr.detectChanges();
  }

  get filteredNotes() {
    const activeNotes = this.allNotes.filter(n => !n.isDeleted);
    if (!this.searchText.trim()) return activeNotes;
    const term = this.searchText.toLowerCase();
    return activeNotes.filter(note =>
      note.title.toLowerCase().includes(term) || note.category.toLowerCase().includes(term)
    );
  }

  get categorySpecificNotes() {
    return this.allNotes.filter(n => {
      const isNotDeleted = !n.isDeleted;
      const matchesCategory = n.category?.toString().trim().toLowerCase() === this.selectedCategoryName?.toString().trim().toLowerCase();
      return isNotDeleted && matchesCategory;
    });
  }

  get trashNotes() {
    return this.allNotes.filter(n => n.isDeleted);
  }

  refreshStats() {
    const activeNotes = this.allNotes.filter(n => !n.isDeleted);
    this.totalNotes = activeNotes.length;
    this.trashCount = this.allNotes.filter(n => n.isDeleted).length;
    this.recentNotes = [...activeNotes].reverse().slice(0, 5);
    this.cdr.detectChanges(); // UI Force Refresh
  }

  fetchUserNotes() {
    const token = localStorage.getItem('token');
    if (!token || !this.userId) return;
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.get<any>(`${this.apiUrl}/notes/user/${this.userId}`, { headers }).subscribe({
      next: (res) => {
        if (res && res.notes) {
          this.allNotes = [...res.notes]; // Spread operator to create new reference
          this.refreshStats();
        }
      }
    });
  }

  uploadNote() {
    if (!this.selectedFile || !this.noteTitle.trim() || !this.category) {
      alert("Please select a file, title and category."); return;
    }
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('title', this.noteTitle.trim());
    formData.append('category', this.category);
    formData.append('userId', this.userId);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.post(`${this.apiUrl}/upload-note`, formData, { headers }).subscribe({
      next: () => {
        alert("Note Uploaded Successfully!");
        this.resetForm();
        this.fetchUserNotes();
        this.changePage('my-notes');
      },
      error: () => alert("Upload failed.")
    });
  }

  onDragOver(e: any) { e.preventDefault(); }

  onDrop(e: any) {
    e.preventDefault();
    if (e.dataTransfer.files.length) this.handleFileSelection(e.dataTransfer.files[0]);
  }

  onFileSelected(e: any) {
    if (e.target.files.length) this.handleFileSelection(e.target.files[0]);
  }

  private handleFileSelection(file: File) {
    this.selectedFile = file;
    this.fileName = file.name;
    if (!this.noteTitle) this.noteTitle = file.name.split('.')[0];
    this.cdr.detectChanges();
  }

  deleteNote(note: any) {
    if (confirm("are you sure? you want to delete this note.")) this.updateStatus(note._id, true);
  }

  restoreNote(note: any) {
    this.updateStatus(note._id, false);
  }

  private updateStatus(id: string, isDeleted: boolean) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.patch(`${this.apiUrl}/notes/trash/${id}`, { isDeleted }, { headers }).subscribe({
      next: () => { 
        // Array update trick: Filter out the item locally for instant effect
        this.allNotes = this.allNotes.map(n => n._id === id ? { ...n, isDeleted: isDeleted } : n);
        this.fetchUserNotes(); 
      }
    });
  }

  permanentDelete(note: any) {
    if (confirm("Delete forever?")) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      this.http.delete(`${this.apiUrl}/notes/${note._id}`, { headers }).subscribe({ 
        next: () => {
          this.allNotes = this.allNotes.filter(n => n._id !== note._id);
          this.fetchUserNotes();
        } 
      });
    }
  }

  emptyTrash() {
    if (confirm("Empty trash?")) {
      const token = localStorage.getItem('token');
      const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
      this.http.delete(`${this.apiUrl}/notes/trash/empty/${this.userId}`, { headers }).subscribe({ 
        next: () => this.fetchUserNotes() 
      });
    }
  }

  restoreAll() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
    this.http.post(`${this.apiUrl}/notes/trash/restore-all/${this.userId}`, {}, { headers }).subscribe({
      next: () => { this.fetchUserNotes(); alert("All notes restored!"); }
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/']);
    alert("logout successful");
  }

  resetForm() {
    this.selectedFile = null;
    this.fileName = '';
    this.noteTitle = '';
    this.category = '';
    this.cdr.detectChanges();
  }

  getInitials(name: string) { return name ? name.charAt(0).toUpperCase() : '?'; }
  viewNote(note: any) { window.open(`http://localhost:3000/uploads/${note.fileName}`, '_blank'); }
  downloadNote(note: any) { window.open(`http://localhost:3000/uploads/${note.fileName}?download=true`, '_self'); }

  getFileIcon(fn: string) {
    const ext = fn?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'fas fa-file-pdf';
    if (ext === 'docx') return 'fas fa-file-word';
    if (['png', 'jpg', 'jpeg'].includes(ext!)) return 'fas fa-file-image';
    return 'fas fa-file-alt';
  }

  getFileColor(fn: string) {
    const ext = fn?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '#f1c40f';
    if (ext === 'docx') return '#3498db';
    if (['png', 'jpg', 'jpeg'].includes(ext!)) return '#e74c3c';
    return '#f1c40f';
  }
}