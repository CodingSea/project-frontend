import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from "@app/sidebar/sidebar";
import { User } from '@app/user';
import { environment } from '@environments/environment';
import { Observable, debounceTime, switchMap } from 'rxjs';
import { Output, EventEmitter } from '@angular/core';
import { Input } from '@angular/core';
import { SafeUrlPipe } from '@app/pipes/safe-url.pipe';

interface DeveloperSelectEvent extends User {
  remove: boolean;
}

@Component({
  selector: 'app-developers-search',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule,SafeUrlPipe ],
  templateUrl: './developers.search.component.html',
  styleUrl: './developers.search.component.css'
})

export class DevelopersSearchComponent implements OnInit
{
@Output() developerSelected = new EventEmitter<DeveloperSelectEvent>();
@Input() selectedIds: number[] = [];  // ✅ receives currently selected dev IDs from parent

isSelected(id: number): boolean {
  return this.selectedIds.includes(id);
}

  constructor(private http: HttpClient, private router: Router) { }

  developers: User[] | null = null;
  searchControl: FormControl = new FormControl('');
  filteredDevelopers: User[] | null = null;

  ngOnInit() {
    this.loadDevelopers();

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      switchMap(searchTerm => this.getDevelopers(searchTerm)) // Call the service
    ).subscribe(
      (response) => {
        this.filteredDevelopers = response;
      },
      (error) => {
        console.log(error);
      }
    );
  }

  loadDevelopers() {
    this.getDevelopers().subscribe(
      (response) => {
        this.developers = response;
        this.filteredDevelopers = response; // Initialize filtered developers
      },
      (error) => {
        console.log(error);
      }
    );
  }

  searchDevelopers(searchTerm: string)
  {
    return this.http.get<User[]>(`${environment.apiUrl}/user/developers?search=${searchTerm}`);
  }

  getDevelopers(searchTerm?: string): Observable<User[]> {
    let params = new HttpParams();

    if (searchTerm) {
      params = params.set('search', searchTerm);
    }

    return this.http.get<User[]>(`${environment.apiUrl}/user/developers`, { params });
  }

selectedProfileId: number | null = null;

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




}
