import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from "@app/sidebar/sidebar";
import { User } from '@app/user';
import { environment } from '@environments/environment';
import { Observable, debounceTime, switchMap } from 'rxjs';

@Component({
  selector: 'app-developers.search.component',
  imports: [ Sidebar, CommonModule, ReactiveFormsModule ],
  templateUrl: './developers.search.component.html',
  styleUrl: './developers.search.component.css'
})
export class DevelopersSearchComponent implements OnInit
{
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
        console.log(response);
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

  viewProfile(userId: number)
  {
    this.router.navigate([ `/profile/user/${userId}` ]);
  }

}
