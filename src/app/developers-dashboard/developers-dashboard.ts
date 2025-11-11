import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "@app/header/header";
import { Project } from '@app/project';
import { Service } from '@app/service';
import { Sidebar } from "@app/sidebar/sidebar";
import { DeveloperCard, User } from '@app/user';
import { ExcelDeveloperImporter } from "@app/excel-developer-importer/excel-developer-importer";

@Component({
  selector: 'app-developers-dashboard',
  standalone: true,
  imports: [ HeaderComponent, Sidebar, CommonModule, FormsModule, ExcelDeveloperImporter ],
  templateUrl: './developers-dashboard.html',
  styleUrls: [ './developers-dashboard.css' ]
})
export class DevelopersDashboard
{
  searchTerm: string = '';
  showAdvancedSearch: boolean = false;

  // Advanced filters
  advName: string = '';
  advSkills: string = '';
  advServices: string = '';
  advTasks: string = '';

  selectedFile: File | null = null;

  u: User = {
    id: 100,
    first_name: "sss",
    last_name: "www",
    email: "aa@gmail.com",
    password: '',
    role: "developer",
    profileImage: "",
    profileImageID: "",
    skills: [],
    certificates: []
  }
  p: Project =
    {
      projectID: 100,
      name: "PP",
      services: [],
      progress: 0,
      members: 0,
      deadline: ""
    }
  service: Service = {
    serviceID: 4,
    name: 'UI Design',
    description: "",
    project: this.p,
    deadline: new Date,
    chief: this.u,
    assignedResources: [],
    backup: []
  }

  // Fake developers array
  developers: DeveloperCard[] = [
    {
      id: 1,
      first_name: 'Fahad',
      last_name: 'Al-Nuaimi',
      role: 'Frontend Developer',
      skills: [ 'Angular', 'TypeScript', 'HTML', 'CSS' ],
      services: [ this.service ],
      tasks: [
        { userId: 1, taskId: 23, title: "ttt" },
        { userId: 1, taskId: 24, title: "ttt" }
      ]
    },
    {
      id: 2,
      first_name: 'Aisha',
      last_name: 'Khalid',
      role: 'Backend Developer',
      skills: [ 'Node.js', 'NestJS', 'PostgreSQL' ],
      services: [],
      tasks: [
        { userId: 2, taskId: 25, title: "ttt" }
      ]
    },
    {
      id: 3,
      first_name: 'Omar',
      last_name: 'Hassan',
      role: 'Full Stack Developer',
      skills: [ 'Angular', 'NestJS', 'MongoDB' ],
      services: [ this.service, this.service ],
      tasks: [] // No tasks
    },
    {
      id: 4,
      first_name: 'Laila',
      last_name: 'Saeed',
      role: 'UI/UX Designer',
      skills: [ 'Figma', 'Adobe XD', 'CSS' ],
      services: [ this.service ],
      // No tasks for this developer
    }
  ];

  // Computed filtered developers
  get filteredDevelopers(): DeveloperCard[]
  {
    const term = this.searchTerm.toLowerCase();

    return this.developers.filter(dev =>
    {
      const matchesMain =
        dev.first_name.toLowerCase().includes(term) ||
        dev.last_name.toLowerCase().includes(term) ||
        dev.role.toLowerCase().includes(term) ||
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
        ? dev.tasks?.some(task =>
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
    const file = event.target.files[ 0 ];
    if (file) this.selectedFile = file;
  }
}
