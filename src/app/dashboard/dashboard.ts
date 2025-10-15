import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '@app/project';
import { Service } from '@app/service';
import { Sidebar } from "@app/sidebar/sidebar";
import { environment } from '@environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [ Sidebar, CommonModule ],
  templateUrl: './dashboard.html',
  styleUrls: [ './dashboard.css' ] // Fixed typo: styleUrl to styleUrls
})
export class Dashboard
{
  constructor(private http: HttpClient, private router: Router) { }

  projects: Project[] | null = null;
  closestServices: Service[] = []; // To hold the closest services

  listProjects()
  {
    this.http.get<Project[]>(`${environment.apiUrl}/project`).subscribe(
      (response) =>
      {
        this.projects = response;
        this.getClosestServices(); // Call the function to get closest services
      },
      (error) =>
      {
        console.log(error);
      }
    );
  }

  getClosestServices()
  {
    const servicesArray: any[] = [];

    // Get the current date for comparison
    const currentDate = new Date();

    // Loop through projects to gather services and their deadlines
    this.projects?.forEach(project =>
    {
      project.services?.forEach(service =>
      {
        if (service.deadline)
        {
          // Calculate total cards and new cards
          const totalCards = service.taskBoard?.cards?.length || 0;
          const newCards = service.taskBoard?.cards?.filter(card => card.column === 'new').length || 0;

          // Calculate completion rate (as a percentage)
          const completionRate = totalCards > 0 ? ((totalCards - newCards) / totalCards) * 100 : 0;

          // Determine the deadline date
          const deadlineDate = new Date(service.deadline);
          const timeDiff = deadlineDate.getTime() - currentDate.getTime();
          const daysUntilDeadline = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert to days

          // Determine the status based on the logic provided
          let status: 'Pending Approval' | 'In-Progress' | 'Completed' | 'At Risk' | 'Overdue';

          if (completionRate === 100)
          {
            status = 'Completed';
          } else if (daysUntilDeadline < 0)
          {
            status = 'Overdue';
          } else if (daysUntilDeadline <= 10)
          {
            status = 'At Risk';
          } else
          {
            status = 'In-Progress';
          }

          // Push service along with its project details
          servicesArray.push({
            ...service,
            deadline: deadlineDate, // Store the deadline as a Date object
            completionRate: completionRate, // Add the calculated completion rate
            status: status, // Add the determined status
            project: project // Include the project object
          });
        }
      });
    });

    // Sort services by deadline
    this.closestServices = servicesArray.sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 5) // Limit to 5 closest services
      .map(item =>
      {
        return {
          ...item,
          projectName: item.project.name // Optionally include project name for easier access
        };
      });
  }

  ngOnInit()
  {
    this.listProjects();
  }
}