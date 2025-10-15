import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '@app/project';
import { Service } from '@app/service';
import { Sidebar } from "@app/sidebar/sidebar";
import { environment } from '@environments/environment';
import { CommonModule } from '@angular/common';
import { ProjectService } from '@app/services/project.service';

@Component({
  selector: 'app-dashboard',
  imports: [ Sidebar, CommonModule ],
  templateUrl: './dashboard.html',
  styleUrls: [ './dashboard.css' ] // Fixed typo: styleUrl to styleUrls
})
export class Dashboard
{
  constructor(private http: HttpClient, private router: Router, private projectService: ProjectService) { }

  projects: Project[] | null = null;
  closestServices: Service[] = []; // To hold the closest services

  projectStatusRate =
    {
      completed: 0,
      inProgress: 0,
      atRisk: 0,
      backlogged: 0,
    }
  strokeDashArray: string = '';

  getProjectStatus()
  {
    const currentDate = new Date();

    this.projectService.getProjects().subscribe((data) =>
    {
      this.projects = data;

      // Initialize counters
      let totalProjects = data.length; // Total number of projects
      this.projectStatusRate = {
        completed: 0,
        inProgress: 0,
        atRisk: 0,
        backlogged: 0, // New property for backlogged tasks
      };

      // Iterate through each project
      data.forEach((project) =>
      {
        let totalServiceCards = 0; // Total cards in the current project
        let completedServiceCards = 0; // Completed cards in the current project
        let atRiskCards = 0; // Count of at-risk cards
        let backloggedCards = 0; // Count of backlogged cards

        // Iterate through project services
        project.services.forEach((service) =>
        {
          const deadlineDate = new Date(service.deadline);
          const timeDiff = deadlineDate.getTime() - currentDate.getTime();
          const daysUntilDeadline = Math.ceil(timeDiff / (1000 * 3600 * 24)); // Convert to days

          if (service.taskBoard?.cards)
          {
            // Iterate through each card in the service
            service.taskBoard.cards.forEach((card) =>
            {
              totalServiceCards++; // Increment total cards

              if (card.column === 'done')
              {
                completedServiceCards++; // Count completed cards
              } else if (card.column === 'new' || card.column === 'work')
              {
                this.projectStatusRate.inProgress++; // Count in-progress cards
              }

              // Check if the deadline is near and the task is not complete
              if (daysUntilDeadline <= 10 && card.column !== 'done')
              {
                atRiskCards++; // Increment at-risk cards count
              }

              // Count backlogged cards (not done and not at risk)
              if (card.column !== 'done' && daysUntilDeadline > 10)
              {
                backloggedCards++; // Increment backlogged cards count
              }
            });
          }
        });

        // Update counts based on completed cards
        this.projectStatusRate.completed += completedServiceCards;

        // Update atRisk count if there are any at-risk cards
        if (atRiskCards > 0)
        {
          this.projectStatusRate.atRisk += atRiskCards;
        }

        // Update backlogged count
        this.projectStatusRate.backlogged += backloggedCards;
      });

      // Calculate the total statuses counted
      const totalCounted = this.projectStatusRate.completed + this.projectStatusRate.inProgress + this.projectStatusRate.atRisk + this.projectStatusRate.backlogged;

      // Adjust percentages to ensure they sum to 100%
      if (totalCounted > 0)
      {
        this.projectStatusRate.completed = (this.projectStatusRate.completed / totalCounted) * 100;
        this.projectStatusRate.inProgress = (this.projectStatusRate.inProgress / totalCounted) * 100;
        this.projectStatusRate.atRisk = (this.projectStatusRate.atRisk / totalCounted) * 100;
        this.projectStatusRate.backlogged = (this.projectStatusRate.backlogged / totalCounted) * 100; // Calculate percentage for backlogged
      } else
      {
        // Handle case where no projects are counted
        this.projectStatusRate.completed = 0;
        this.projectStatusRate.inProgress = 0;
        this.projectStatusRate.atRisk = 0;
        this.projectStatusRate.backlogged = 0; // Set backlogged to 0
      }

      console.log(this.projects);
      console.log(this.projectStatusRate);
    });
  }

  updateStrokeDashArray()
  {
    const totalCircumference = 2 * Math.PI * 15; // Circumference of the circle with radius 15
    const strokeLength = (this.projectStatusRate.completed / 100) * totalCircumference;
    const remainingLength = totalCircumference - strokeLength;

    // Update the strokeDashArray in the format "visible, remaining"
    this.strokeDashArray = `${strokeLength}, ${remainingLength}`;
  }

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

    this.getProjectStatus();

    this.updateStrokeDashArray();
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

  getProgress(service: Service): string
  {
    let result = "";

    result = this.formatDecimal(service.completionRate!);

    return result;
  }
}