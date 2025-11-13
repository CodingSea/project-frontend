import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "@app/header/header";
import { DeveloperCard } from '@app/user';
import { ExcelDeveloperImporter } from "@app/excel-developer-importer/excel-developer-importer";
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '@environments/environment';
import { TaskCard } from '@app/task-card';
import { Sidebar } from "@app/sidebar/sidebar";
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-developers-dashboard',
  standalone: true,
  imports: [ HeaderComponent, CommonModule, FormsModule, ExcelDeveloperImporter, Sidebar, RouterLink ],
  templateUrl: './developers-dashboard.html',
  styleUrls: [ './developers-dashboard.css' ]
})
export class DevelopersDashboard implements OnInit
{
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router) { }

  @ViewChild('importComplete') importer!: ExcelDeveloperImporter;

  searchTerm: string = '';
  showAdvancedSearch: boolean = false;

  // Advanced filters
  advName: string = '';
  advSkills: string = '';
  advServices: string = '';
  advTasks: string = '';

  selectedFile: File | null = null;

  developers: DeveloperCard[] = [];
  filteredDevelopers: DeveloperCard[] = [];

  // Pagination
  totalDevelopers: number = 0; // Total count from API
  pageSize: number = 12; // Developers per page
  currentPage: number = 1;
  pageNumbers: number[] = [];

  ngOnInit(): void
  {
    this.getDevelopersFromDB();
  }

  async getDevelopersFromDB(): Promise<void>
  {
    try
    {
      const params = new URLSearchParams();
      params.append('page', this.currentPage.toString());
      params.append('limit', this.pageSize.toString());
      if (this.showAdvancedSearch)
      {
        params.append('name', this.advName);
        params.append('skills', this.advSkills);
        params.append('services', this.advServices);
        params.append('tasks', this.advTasks);
      }
      else
      {
        params.append('name', this.searchTerm);
      }

      // Fetch developers based on advanced filters
      this.developers = await this.http.get<DeveloperCard[]>(`${environment.apiUrl}/user/developers-card?${params.toString()}`).toPromise() || [];
      console.log('Developers fetched:', this.developers.length);
      
      this.developers.forEach(developer =>
      {
        developer.cards = developer.cards?.filter(task => task.column !== "done");
      });

      this.developers.forEach((d) =>
      {
        d.services = [];
        d.cards?.forEach((task) =>
        {
          const service = task.taskBoard?.service;
          if (!service) return; // skip if null or undefined

          // Check if the service already exists (by id or name)
          const alreadyExists = d.services?.some(s => s.serviceID === service.serviceID);

          // Push only if not already in array
          if (!alreadyExists)
          {
            d.services?.push(service);
          }
        });
      });

      const countParams = new URLSearchParams();
      countParams.append('name', this.advName);
      countParams.append('skills', this.advSkills);
      countParams.append('services', this.advServices);
      countParams.append('tasks', this.advTasks);

      // Fetch total developers count using the developers-count endpoint
      this.totalDevelopers = await this.http.get<number>(`${environment.apiUrl}/user/developers-count?${countParams.toString()}`).toPromise() || 0;

      // this.populateDeveloperTasks();
      this.updatePageNumbers();
    } catch (err)
    {
      console.log(err);
    }
  }

  updatePageNumbers(): void
  {
    const total = this.getTotalPages(); // Total number of pages based on count
    const curr = this.currentPage;
    this.pageNumbers = [];

    let start = Math.max(1, curr - 2);
    let end = Math.min(total, curr + 2);

    if (end - start < 4)
    {
      if (curr <= 3) end = Math.min(5, total);
      else start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) this.pageNumbers.push(i);
  }

  getTotalPages(): number
  {
    return Math.ceil(this.totalDevelopers / this.pageSize) || 1; // Calculates total pages
  }

  changePage(page: number): void
  {
    if (page < 1 || page > this.getTotalPages()) return;
    this.currentPage = page;
    this.getDevelopersFromDB(); // Fetch data for the new page
  }

  jumpToPage(firstPage: boolean): void
  {
    this.currentPage = firstPage ? 1 : this.getTotalPages();
    this.getDevelopersFromDB(); // Fetch data for the new page
  }

  get paginatedDevelopers(): DeveloperCard[]
  {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredDevelopers.slice(startIndex, startIndex + this.pageSize);
  }

  toggleAdvancedSearch(): void
  {
    this.showAdvancedSearch = !this.showAdvancedSearch;
  }

  resetAdvanced(): void
  {
    this.advName = '';
    this.advSkills = '';
    this.advServices = '';
    this.advTasks = '';
    this.getDevelopersFromDB(); // Re-fetch data without filters
  }

  onFileSelected(event: any): void
  {
    const file = event.target.files[ 0 ];
    if (file) this.selectedFile = file;
  }

  viewProfile(id: number)
  {
    this.router.navigate([ `/profile/user/${id}` ])
  }
}