import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SafeUrlPipe } from '@app/pipes/safe-url.pipe';
import { User } from '@app/user';
import { environment } from '@environments/environment';
import { Observable, debounceTime, switchMap } from 'rxjs';

interface DeveloperSelectEvent extends User {
  remove: boolean;
}

@Component({
  selector: 'app-developers-search',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SafeUrlPipe],
  templateUrl: './developers.search.component.html',
  styleUrl: './developers.search.component.css',
})
export class DevelopersSearchComponent implements OnInit {
  @Output() developerSelected = new EventEmitter<DeveloperSelectEvent>();
  @Input() selectedIds: number[] = [];

  developers: User[] = [];
  filteredDevelopers: User[] = [];
  searchControl = new FormControl('');
  selectedProfileId: number | null = null;
  isImageLoading = true;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadDevelopers();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        switchMap((term) => this.getDevelopers(term ?? undefined))
      )
      .subscribe({
        next: (res) => (this.filteredDevelopers = res),
        error: (err) => console.error(err),
      });
  }

  loadDevelopers() {
    this.getDevelopers().subscribe({
      next: (res) => {
        this.developers = res;
        this.filteredDevelopers = res;
      },
      error: (err) => console.error(err),
    });
  }

  getDevelopers(searchTerm?: string): Observable<User[]> {
    let params = new HttpParams();
    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('search', searchTerm);
    }
    return this.http.get<User[]>(`${environment.apiUrl}/user/developers`, { params });
  }

  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  openProfile(userId: number) {
    this.selectedProfileId = userId;
  }

  closeProfile() {
    this.selectedProfileId = null;
  }

  selectDeveloper(dev: User) {
    if (this.isSelected(dev.id)) {
      this.developerSelected.emit({ ...dev, remove: true });
    } else {
      this.developerSelected.emit({ ...dev, remove: false });
    }
  }

  /** Build a safe, absolute image URL that works in all routes/modals */
  getProfileImage(path?: string | null): string {
    if (!path || path.trim() === '') return 'images/user.png';
    if (/^https?:\/\//i.test(path)) return path;

    const base = environment.apiUrl.replace(/\/+$/, '');
    if (path.startsWith('/')) return `${base}${path}`;
    return `${base}/${path}`;
  }

  onImageLoad() {
    this.isImageLoading = false;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'images/user.png';
  }
}
