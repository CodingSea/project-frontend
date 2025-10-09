import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectService, Project } from '@app/services/project.service';
import { Sidebar } from "@app/sidebar/sidebar"; // ✅ use one Project type

@Component({
  selector: 'app-project-management',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  templateUrl: './project-management.html',
  styleUrls: ['./project-management.scss'] // ✅ plural
})
export class ProjectManagement implements OnInit {
  projects: Project[] = [];

  // New Project Modal
  showNewProject = false;
  newProject: Partial<Project> = this.blankNewProject();

  // Filters
  showFilter = false;
  selectedFilter: 'all' | 'active' | 'in-review' | 'urgent' = 'all';
  filterState = { active: true, inReview: true, urgent: true };

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.projectService.getProjects().subscribe((data) => {
      // ensure dueDate is a yyyy-mm-dd string for the date pipe
      this.projects = (data ?? []).map(p => ({
        ...p
      }));
    });
  }

  // card click from template
  onCardClick(p: Project) {
    // Do whatever you want here (navigate, open details, etc.)
    // For now just avoid the TS error:
    console.log('Open project', p.projectID);
  }

  // New project modal handlers
  openNewProject() { this.showNewProject = true; this.newProject = this.blankNewProject(); }
  closeNewProject() { this.showNewProject = false; }

  private blankNewProject(): Partial<Project> {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const yyyyMmDd = d.toISOString().slice(0, 10);
    return { name: '', description: '', status: 'Active', progress: 0 };
  }

  saveNewProject(form: any) {
    if (form.invalid) return;

    this.projectService.createProject(this.newProject).subscribe(created => {
      this.projects = [created, ...this.projects];
      this.closeNewProject();
    });
  }


  // Filter panel
  openFilter() { this.showFilter = true; }
  closeFilter() { this.showFilter = false; }
  applyFilters() {}

  matchesStatus(status?: string): boolean {
    if (!status) return false;
    const s = status.toLowerCase();
    if (this.selectedFilter !== 'all') {
      return (this.selectedFilter === 'active'    && s === 'active')
          || (this.selectedFilter === 'in-review' && s === 'in review')
          || (this.selectedFilter === 'urgent'    && s === 'urgent');
    }
    return (s === 'active' && this.filterState.active)
        || (s === 'in review' && this.filterState.inReview)
        || (s === 'urgent' && this.filterState.urgent);
  }
}
