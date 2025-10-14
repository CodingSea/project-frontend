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

          servicesArray.push({
            service,
            deadline: new Date(service.deadline), // Convert to Date object
            completionRate: completionRate // Add the calculated completion rate
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
          ...item.service,
          completionRate: item.completionRate // Include the completion rate in the service object
        };
      }); // Extract the service object along with the completion rate
  }
  ngOnInit()
  {
    this.listProjects();
  }
}