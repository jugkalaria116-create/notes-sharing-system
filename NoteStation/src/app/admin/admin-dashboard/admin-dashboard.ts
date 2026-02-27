import { Component, ViewEncapsulation, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TimeAgoPipe } from '../../time-ago-pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, TimeAgoPipe],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css'],
  encapsulation: ViewEncapsulation.None
})
export class AdminDashboardComponent implements OnInit {

  /* ================= FILE ICON ================= */

  getFileIcon(name: string) {
    if (!name) return 'fa-file-lines';
    const lower = name.toLowerCase();

    if (lower.endsWith('.pdf')) return 'fa-file-pdf';
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'fa-file-word';

    return 'fa-file-lines';
  }

  /* ================= FILE COLOR ================= */

  getFileColor(fn: string): string {
    const ext = fn?.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') return '#f1c40f';
    if (ext === 'docx' || ext === 'doc') return '#3498db';
    if (['png','jpg','jpeg'].includes(ext!)) return '#e74c3c';
    if (ext === 'txt') return '#9b59b6';

    return '#f1c40f';
  }

  /* ================= VARIABLES ================= */

  activeTab: string = 'dashboard';
  users: any[] = [];
  notes: any[] = [];
  trashNotes: any[] = [];
  allUsersBackup: any[] = [];
  allNotesBackup: any[] = [];
  loading: boolean = false;

  chart: any;
  pieChart: any;
  donutChart: any; // ⭐ ADDED DONUT

  queries: any[] = [];
  selectedQuery: any = null;

  stats = {
    totalNotes: 0,
    totalUsers: 0,
    trashCount: 0,
    totalCategories: 4,
    messageCount: 0
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  /* ================= INIT ================= */

  ngOnInit(): void {

    this.loadChartScript();

    if (!localStorage.getItem('adminToken')) {
      this.router.navigate(['/']);
      return;
    }

    this.getStats();
    this.getAllUsers();
    this.getAllQueries();
    this.getTrashNotes();
  }

  /* ================= LOAD CHART LIB ================= */

  loadChartScript() {
    if ((window as any).Chart) return;

    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.async = true;
    document.body.appendChild(script);
  }

  /* ================= LOGOUT ================= */

  logout() {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      alert("Logout successful!");
      this.router.navigate(['/login']).then(() => window.location.reload());
    }
  }

  /* ================= USERS ================= */

  getAllUsers() {
    this.loading = true;

    this.http.get<any>('http://localhost:3000/api/admin/all-users').subscribe({
      next: (res) => {

        if (res?.success) {

          const sorted = (res.users || []).sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          this.users = sorted;
          this.allUsersBackup = [...sorted];
          this.stats.totalUsers = sorted.length;

          this.getAllNotesAdmin();
        }

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /* ================= NOTES ================= */

  getAllNotesAdmin() {
    this.loading = true;

    this.http.get<any>('http://localhost:3000/api/admin/all-notes').subscribe({
      next: (res) => {

        if (res?.success) {

          const processed = (res.notes || []).map((note: any) => {

            let name = 'User';

            if (typeof note.userId === 'object')
              name = note.userId.firstName;

            else if (typeof note.userId === 'string') {
              const found = this.users.find(u => u._id === note.userId);
              name = found ? found.firstName : 'User';
            }

            return { ...note, uploadedByName: name };
          });

          this.notes = processed;
          this.allNotesBackup = [...processed];
          this.stats.totalNotes = processed.length;
        }

        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /* ================= SEARCH ================= */

  searchData(event: any, type: string) {

    const term = event.target.value.toLowerCase().trim();

    if (type === 'users') {
      this.users = term
        ? this.allUsersBackup.filter(u =>
            u.firstName?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term))
        : [...this.allUsersBackup];
    }

    if (type === 'notes') {
      this.notes = term
        ? this.allNotesBackup.filter(n =>
            n.title?.toLowerCase().includes(term) ||
            n.category?.toLowerCase().includes(term))
        : [...this.allNotesBackup];
    }

    this.cdr.detectChanges();
  }

  searchUser(event: any) {
    const term = event.target.value.toLowerCase().trim();

    this.users = term
      ? this.allUsersBackup.filter(u =>
          u.firstName?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term))
      : [...this.allUsersBackup];

    this.cdr.detectChanges();
  }

  /* ================= STATS ================= */

  getStats() {
    this.http.get<any>('http://localhost:3000/api/admin/stats')
      .subscribe(res => {
        if (res?.success) {
          this.stats = res.stats;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.renderChart();
            this.renderPieChart();
            this.renderDonutChart(); // ⭐ ADDED
          }, 200);
        }
      });
  }

  /* ================= MAIN CHART ================= */

  renderChart() {

    const canvas = document.getElementById('adminChart') as HTMLCanvasElement;
    if (!canvas || !(window as any).Chart) return;

    if (this.chart) this.chart.destroy();

    const Chart = (window as any).Chart;

    this.chart = new Chart(canvas, {
      data: {
        labels: ['Users', 'Notes', 'Messages', 'Trash'],
        datasets: [
          {
            type: 'bar',
            label: 'System Data',
            data: [
              this.stats.totalUsers,
              this.stats.totalNotes,
              this.stats.messageCount,
              this.stats.trashCount
            ],
            borderRadius: 10
          },
          {
            type: 'line',
            label: 'Trend',
            data: [
              this.stats.totalUsers,
              this.stats.totalNotes,
              this.stats.messageCount,
              this.stats.trashCount
            ],
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        animation: { duration: 1400 },
        plugins: {
          legend: { labels: { color: "#ccc" } }
        },
        scales: {
          y: { beginAtZero: true, ticks:{color:"#aaa"}, grid:{color:"#222"} },
          x: { ticks:{color:"#aaa"}, grid:{display:false} }
        }
      }
    });
  }

  /* ================= PIE ================= */

  renderPieChart() {

    const canvas = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!canvas || !(window as any).Chart) return;

    if (this.pieChart) this.pieChart.destroy();

    const Chart = (window as any).Chart;

    this.pieChart = new Chart(canvas,{
      type:'pie',
      data:{
        labels:['Users','Notes','Messages','Trash'],
        datasets:[{
          data:[
            this.stats.totalUsers,
            this.stats.totalNotes,
            this.stats.messageCount,
            this.stats.trashCount
          ]
        }]
      },
      options:{
        responsive:true,
        animation:{duration:1600},
        plugins:{
          legend:{position:'bottom',labels:{color:"#ccc"}}
        }
      }
    });
  }

  /* ================= DONUT ================= */

  renderDonutChart(){

    const canvas = document.getElementById('donutChart') as HTMLCanvasElement;
    if(!canvas || !(window as any).Chart) return;

    if(this.donutChart) this.donutChart.destroy();

    const Chart = (window as any).Chart;

    this.donutChart = new Chart(canvas,{
      type:'doughnut',
      data:{
        labels:['Users','Notes','Messages','Trash'],
        datasets:[{
          data:[
            this.stats.totalUsers,
            this.stats.totalNotes,
            this.stats.messageCount,
            this.stats.trashCount
          ],
          cutout:'65%'
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        animation:{duration:1500},
        plugins:{
          legend:{
            position:'bottom',
            labels:{color:"#ccc"}
          }
        }
      }
    })
  }

  /* ================= DELETE USER ================= */

  deleteUser(id: string) {
    if (confirm('Delete user?')) {
      this.http.delete(`http://localhost:3000/api/admin/user/${id}`)
        .subscribe(() => this.getAllUsers());
    }
  }

  /* ================= NOTES ================= */

  viewFile(name: string) {
    window.open(`http://localhost:3000/uploads/${name}`, '_blank');
  }

  deleteNote(id: string) {
    if (confirm("Delete permanently?")) {
      this.http.delete(`http://localhost:3000/api/admin/note-delete/${id}`)
        .subscribe(() => {
          this.getAllNotesAdmin();
          this.getStats();
        });
    }
  }

  /* ================= TRASH ================= */

  getTrashNotes() {
    this.http.get<any>('http://localhost:3000/api/admin/trash-notes')
      .subscribe(res => {
        if (res.success) {
          this.trashNotes = res.notes;
          this.cdr.detectChanges();
        }
      });
  }

  restoreNote(id: string) {
    this.http.patch(`http://localhost:3000/api/admin/restore-note/${id}`, {})
      .subscribe(() => {
        this.getTrashNotes();
        this.getStats();
      });
  }

  deletePermanently(id: string) {
    if (confirm("Delete forever?")) {
      this.http.delete(`http://localhost:3000/api/admin/note-delete/${id}`)
        .subscribe(() => {
          this.getTrashNotes();
          this.getStats();
        });
    }
  }

  restoreAllTrash() {
    this.http.post<any>('http://localhost:3000/api/admin/restore-all-trash', {})
      .subscribe(() => {
        this.getTrashNotes();
        this.getStats();
      });
  }

  emptyTrash() {
    if (confirm("Empty trash permanently?")) {
      this.http.delete(`http://localhost:3000/api/admin/empty-trash`)
        .subscribe(() => {
          this.getTrashNotes();
          this.getStats();
        });
    }
  }

  /* ================= CONTACT ================= */

  getAllQueries() {
    this.http.get<any>('http://localhost:3000/api/admin/queries')
      .subscribe(res => {
        if (res.success) {
          this.queries = res.queries;
          this.cdr.detectChanges();
        }
      });
  }

  viewQuery(q: any) {
    this.selectedQuery = q;
    this.cdr.detectChanges();
  }

  closeQuery() {
    this.selectedQuery = null;
    this.cdr.detectChanges();
  }

  deleteQuery(id: string) {
    if (confirm("Delete message?")) {
      this.http.delete(`http://localhost:3000/api/admin/query/${id}`)
        .subscribe(() => {
          this.getAllQueries();
          this.getStats();
        });
    }
  }
}