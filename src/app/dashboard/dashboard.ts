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

      data.map((p) =>
      {
        let totalCardsCount = 0; // Reset total cards count for each project
        let completedCardsCount = 0; // Reset completed cards count for each project
        let inProgressCardsCount = 0; // New variable for in-progress cards count
        let backloggedCardsCount = 0; // New variable for in-progress cards count
        const uniqueMembers = new Set(); // Track unique member IDs
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
            backloggedCardsCount += s.taskBoard.cards.filter(card => card.column === 'new').length; // Count new cards
            inProgressCardsCount += s.taskBoard.cards.filter(card => card.column === 'work').length; // Count in-progress cards
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

        // Update project status rates
        this.projectStatusRate.completed += completedCardsCount;
        this.projectStatusRate.inProgress += inProgressCardsCount;
        this.projectStatusRate.backlogged += backloggedCardsCount;

        p.members = uniqueMembers.size;
      });

      // Calculate total counted for percentages
      const totalCounted = this.projectStatusRate.completed + this.projectStatusRate.inProgress + this.projectStatusRate.atRisk + this.projectStatusRate.backlogged; // Include other statuses as needed

      // Adjust percentages
      if (totalCounted > 0)
      {
        this.projectStatusRate.completed = (this.projectStatusRate.completed / totalCounted) * 100;
        this.projectStatusRate.inProgress = (this.projectStatusRate.inProgress / totalCounted) * 100;
        this.projectStatusRate.backlogged = (this.projectStatusRate.backlogged / totalCounted) * 100;
        // Add calculations for at-risk and backlogged as necessary
      } else
      {
        this.projectStatusRate.completed = 0;
        this.projectStatusRate.inProgress = 0;
        this.projectStatusRate.backlogged = 0;
      }

      console.log(this.projects);
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