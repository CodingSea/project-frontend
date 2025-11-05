import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  title = 'ProjectHub';
  avatarUrl: string = 'images/user.png';
  currentUserId: number | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    // 1) Instant load from cache
    const cached = localStorage.getItem('profileImage');
    if (cached) this.avatarUrl = cached;

    // 2) Listen for cross-tab changes
    window.addEventListener('storage', this.syncFromStorage);

    // 3) Listen for same-tab custom event
    window.addEventListener('profile-image-changed', this.syncFromCustomEvent as EventListener);

    // 4) Decode token & background refresh
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      this.currentUserId = Number(decoded.sub);
      this.loadUser();
    } catch {
      console.warn('Invalid token');
    }
  }

  ngOnDestroy() {
    window.removeEventListener('storage', this.syncFromStorage);
    window.removeEventListener('profile-image-changed', this.syncFromCustomEvent as EventListener);
  }

  // Cross-tab sync
  private syncFromStorage = (e: StorageEvent) => {
    if (e.key === 'profileImage') {
      this.avatarUrl = e.newValue || 'images/user.png';
    }
  };

  // Same-tab instant sync
  private syncFromCustomEvent = (e: CustomEvent) => {
    const url = (e.detail as string | null) || 'images/user.png';
    this.avatarUrl = url;
    // keep cache aligned
    if (e.detail) localStorage.setItem('profileImage', url);
    else localStorage.removeItem('profileImage');
  };

  private loadUser() {
    if (!this.currentUserId) return;

    this.http.get<any>(`${environment.apiUrl}/user/${this.currentUserId}`).subscribe({
      next: (user) => {
        const img = user?.profileImage ? this.fixImage(user.profileImage) : 'images/user.png';
        this.avatarUrl = img;
        localStorage.setItem('profileImage', img);
      },
      error: () => {}
    });
  }

  private fixImage(path: string | null | undefined): string {
    if (!path) return 'images/user.png';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl.replace('/api','')}/${path}`.replace(/\/+/g, '/');
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
