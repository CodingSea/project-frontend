import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "@app/header/header";
import { Project } from '@app/project';
import { Service } from '@app/service';
import { Sidebar } from "@app/sidebar/sidebar";
import { DeveloperCard, User } from '@app/user';
import { ExcelDeveloperImporter } from "@app/excel-developer-importer/excel-developer-importer";
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { TaskCard } from '@app/task-card';

@Component({
  selector: 'app-developers-dashboard',
  standalone: true,
  imports: [HeaderComponent, Sidebar, CommonModule, FormsModule, ExcelDeveloperImporter],
  templateUrl: './developers-dashboard.html',
  styleUrls: ['./developers-dashboard.css']
})
export class DevelopersDashboard implements OnInit
{
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  searchTerm: string = '';
  showAdvancedSearch: boolean = false;

  // Advanced filters
  advName: string = '';
  advSkills: string = '';
  advServices: string = '';
  advTasks: string = '';

  selectedFile: File | null = null;

  // Fake developers array
  developers: DeveloperCard[] | undefined = [];

  ngOnInit(): void
  {
    this.getDevelopersFromDB();
  }

  async getDevelopersFromDB()
  {
    try
    {
      this.developers = await this.http.get<DeveloperCard[]>(`${environment.apiUrl}/user/developers-card`).toPromise();

      const developerIds: number[] = this.developers?.map(user => user.id) || [];

      await this.http.post<TaskCard[]>(`${environment.apiUrl}/user/developers-task`, developerIds).subscribe(
        (res) =>
        {
          res.forEach((task) =>
          {
            // Check each developer to see if they are involved in the task
            task.users?.forEach((userId) =>
            {
              const developer = this.developers?.find(developer => developer.id === userId);

              if (developer)
              {
                // Initialize tasks array if it doesn't exist
                developer.cards = developer.cards || [];
                // Add the task to the developer's tasks
                developer.cards.push(task);
              }
            });
          });
        },
        (err) =>
        {
          console.log(err);
        }
      )

      console.log(this.developers);

      this.cdr.markForCheck();

    }
    catch (err)
    {
      console.log(err);
    }
  }

  // Computed filtered developers
  get filteredDevelopers(): DeveloperCard[]
  {
    const term = this.searchTerm.toLowerCase();

    return this.developers!.filter(dev =>
    {
      const matchesMain =
        dev.first_name.toLowerCase().includes(term) ||
        dev.last_name.toLowerCase().includes(term) ||
        dev.skills.some(skill => skill.toLowerCase().includes(term));

      const matchesAdvName = this.advName
        ? `${dev.first_name} ${dev.last_name}`.toLowerCase().includes(this.advName.toLowerCase())
        : true;

      const matchesAdvSkills = this.advSkills
        ? dev.skills.some(skill =>
          skill.toLowerCase().includes(this.advSkills.toLowerCase())
        )
        : true;

      const matchesAdvServices = this.advServices
        ? dev.services?.some(service =>
          service.name.toLowerCase().includes(this.advServices.toLowerCase())
        )
        : true;

      const matchesAdvTasks = this.advTasks
        ? dev.cards?.some(task =>
          task.title.toLowerCase().includes(this.advTasks.toLowerCase())
        )
        : true;

      return matchesMain && matchesAdvName && matchesAdvSkills && matchesAdvServices && matchesAdvTasks;
    });
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
  }

  onFileSelected(event: any): void
  {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }
}
