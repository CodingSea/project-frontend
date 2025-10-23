import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '@app/services/project.service';
import { Sidebar } from "@app/sidebar/sidebar"; // ✅ use one Project type
import { Router } from '@angular/router';
import { Project } from '@app/project';
import { ServiceInfo } from '@app/service-info';

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
  newProject: Partial<Project> = this.blankNewProject();

  openMenuId: number | null = null;

  // Filters
  showFilter = false;
  selectedFilter: 'all' | 'active' | 'in-review' | 'urgent' = 'all';
  filterState = { active: true, inReview: true, urgent: true };

  projectsInfo =
    {
      totalProjects: 0,

    }

  constructor(private projectService: ProjectService, private router: Router) { }
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

      console.log(this.projects);
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

  private blankNewProject(): Partial<Project>
  {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const yyyyMmDd = d.toISOString().slice(0, 10);
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
        || (this.selectedFilter === 'in-review' && s === 'in review')
        || (this.selectedFilter === 'urgent' && s === 'urgent');
    }
    return (s === 'active' && this.filterState.active)
      || (s === 'in review' && this.filterState.inReview)
      || (s === 'urgent' && this.filterState.urgent);
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

  goToEdit(s: Project, event: Event)
  {
    event.stopPropagation();
    window.scroll(0, 0);
    // const projectId = this.projectId ?? this.route.snapshot.paramMap.get('projectId');
    // this.router.navigate([ `/projects/${projectId}/services/${s.serviceID}/edit` ]);
  }

  async deleteProject(s: Project)
  {
    try
    {
      // const response = await this.http.delete(`${environment.apiUrl}/service/${s.serviceID}`).toPromise();

      // this.loadServices();
    }
    catch (error)
    {
      console.error('Error deleting service:', error);
    }
  }

}
