import { Component, OnInit } from '@angular/core';
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

export class ProjectManagement implements OnInit
{
  projects: Project[] = [];

  // servicesInfo: ServiceInfo[] = [];

  // New Project Modal
  showNewProject = false;
  newProject: Partial<Project> = this.blankNewProject();

  // Filters
  showFilter = false;
  selectedFilter: 'all' | 'active' | 'in-review' | 'urgent' = 'all';
  filterState = { active: true, inReview: true, urgent: true };

  projectsInfo =
    {
      totalProjects: 0,

    }

  constructor(private projectService: ProjectService, private router: Router) { }

  ngOnInit()
  {
    this.projectService.getProjects().subscribe((data) =>
    {
      this.projects = data;

      data.map((p) =>
      {
        p.members = 0;
        p.services.map((s) =>
        {
          if(s.chief)
          {
            p.members++;
            console.log(p.members)
          }
          // if(s.projectManager)
          // {
          //   p.members++;
          // }
          // if(s.assignedResources?.length > 0)
          // {
          //   p.members += s.assignedResources.length;
          // }
          // if(s.backup)
          // {
          //   p.members += s.backup.length;
          // }
        })
      })

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
}
