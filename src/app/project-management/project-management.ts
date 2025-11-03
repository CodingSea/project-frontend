import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '@app/services/project.service';
import { Sidebar } from "@app/sidebar/sidebar"; // ✅ use one Project type
import { Router } from '@angular/router';
import { Project } from '@app/project';
import { ServiceInfo } from '@app/service-info';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [ CommonModule, FormsModule, Sidebar ],
  templateUrl: './project-management.html',
  styleUrls: [ './project-management.scss' ] // ✅ plural
})

export class ProjectManagement implements OnInit, AfterViewInit
{
  projects: Project[] = [];

  // servicesInfo: ServiceInfo[] = [];

  // New Project Modal
  showNewProject = false;
  showEditProject = false;
  newProject: Partial<Project> = this.blankNewProject();
  editProject: Partial<Project> = this.blankNewProject();
  lastEditProject: Partial<Project> = this.blankNewProject();

  openMenuId: number | null = null;

  // Filters
  showFilter = false;
  selectedFilter: 'all' | 'active' | 'on hold' = 'all';
  filterState = { active: true, onHold: true, urgent: true };

  projectsInfo =
    {
      totalProjects: 0,

    }

  constructor(private projectService: ProjectService, private router: Router, private http: HttpClient) { }
  ngAfterViewInit(): void
  {
    document.addEventListener('click', () =>
    {
      this.openMenuId = null;
    });
  }

  ngOnInit()
  {
    window.scrollTo(0, 0);

    this.loadProjects();
  }

  loadProjects()
  {
    this.projectService.getProjects().subscribe((data) =>
    {
      this.projects = data;

      data.map((p) =>
      {
        let totalCardsCount = 0; // Reset total cards count for each project
        let completedCardsCount = 0; // Reset completed cards count for each project
        const uniqueMembers = new Set(); // Create a Set to track unique member IDs
        p.members = 0; // Initialize member count to 0
        let closestDeadline: Date | null = null;

        p.services.map((s) =>
        {
          if (s.chief)
          {
            uniqueMembers.add(s.chief.id);
          }
          if (s.projectManager)
          {
            uniqueMembers.add(s.projectManager.id);
          }
          if (s.assignedResources?.length > 0)
          {
            s.assignedResources.forEach(resource => uniqueMembers.add(resource.id));
          }
          if (s.backup?.length > 0)
          {
            s.backup.forEach(b => uniqueMembers.add(b.id));
          }

          if (s.taskBoard?.cards)
          { // Check if cards exist
            totalCardsCount += s.taskBoard.cards.length; // Add total number of cards
            completedCardsCount += s.taskBoard.cards.filter(card => card.column === 'done').length; // Count completed cards
          }

          // Determine the closest deadline
          if (s.deadline)
          {
            const serviceDeadline = new Date(s.deadline);
            if (!closestDeadline || serviceDeadline < closestDeadline)
            {
              closestDeadline = serviceDeadline; // Update closest deadline
            }
          }
        });

        p.deadline = closestDeadline ? closestDeadline : '';

        // Calculate the progress percentage for the current project
        p.progress = totalCardsCount > 0
          ? (completedCardsCount / totalCardsCount) * 100
          : 0;

        p.members = uniqueMembers.size;
      });
    });
  }

  onCardClick(p: Project)
  {
    if (!p.projectID) return;

    this.router.navigate([ `/projects/${p.projectID}/services` ]);
  }


  // New project modal handlers
  openNewProject() { this.showNewProject = true; this.newProject = this.blankNewProject(); }
  closeNewProject() { this.showNewProject = false; }

  openEditProject() { this.showEditProject = true; this.editProject = this.blankNewProject(); }
  closeEditProject()
  {
    this.editProject = { ...this.lastEditProject };
    this.showEditProject = false;
    this.loadProjects();
  }

  private blankNewProject(): Partial<Project>
  {
    return { name: '', status: 'Active', progress: 0 };
  }

  saveNewProject(form: any)
  {
    if (form.invalid) return;

    this.projectService.createProject(this.newProject).subscribe(created =>
    {
      this.projects = [ created, ...this.projects ];
      this.closeNewProject();
    });

    this.loadProjects();
  }


  // Filter panel
  openFilter() { this.showFilter = true; }
  closeFilter() { this.showFilter = false; }
  applyFilters() { }

  matchesStatus(status?: string): boolean
  {
    if (!status) return false;
    const s = status.toLowerCase();
    if (this.selectedFilter !== 'all')
    {
      return (this.selectedFilter === 'active' && s === 'active')
        || (this.selectedFilter === 'on hold' && s === 'on hold');
    }
    return (s === 'active' && this.filterState.active)
      || (s === 'on hold' && this.filterState.onHold);
  }

  formatDecimal(num: number): string
  {
    // Round to one decimal place to handle cases like 1.123 -> 1.1 or 1.987 -> 2.0
    const roundedNum = Math.round(num * 10) / 10;

    // Convert to string
    let result = String(roundedNum);

    // Remove trailing .0 if present
    if (result.endsWith(".0"))
    {
      result = result.substring(0, result.length - 2);
    }

    return result;
  }

  getLimitedString(inputString: string, letterAmount: number): string
  {
    return inputString.slice(0, letterAmount) + "...";
  }

  toggleMenu(id: number, event: Event)
  {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  async goToEdit(s: Project, event: Event)
  {
    this.lastEditProject = { ...s }; // Store the current project state
    event.stopPropagation();

    this.openEditProject();
    this.editProject = { ...s }; // Set the project to edit
  }

  async updateProject(form: any)
  {
    // if (form.invalid) return;

    const updatedProject =
    {
      name: this.editProject.name,
      description: this.editProject.description,
      status: this.editProject.status
    }

    this.lastEditProject = { ...updatedProject };

    await this.http.patch(`${environment.apiUrl}/project/${this.editProject.projectID}`, updatedProject).subscribe(
      (res) =>
      {

      },
      (err) =>
      {
        console.log(err);
      }
    )

    this.closeEditProject()
  }

  async deleteProject(s: Project)
  {
    try
    {
      await this.http.delete(`${environment.apiUrl}/project/${s.projectID}`).toPromise();

      this.loadProjects();
    }
    catch (error)
    {
      console.error('Error deleting service:', error);
    }
  }

}
