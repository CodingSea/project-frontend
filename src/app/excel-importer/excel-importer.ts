import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Project } from '@app/project';
import { ProjectManagement } from '@app/project-management/project-management';
import { Service } from '@app/service';
import { User } from '@app/user';
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-excel-importer',
  imports: [ CommonModule ],
  templateUrl: './excel-importer.html',
  styleUrls: [ './excel-importer.css' ]
})
export class ExcelImporter
{
  constructor(private http: HttpClient, private projectManagement: ProjectManagement) { }

  excelData: any[] = [];
  groupedData: { projectName: string; services: string[] }[] = []; // Array to hold projects and their services
  allProjects: Project[] = [];

  onFileChange(event: any)
  {
    const target: DataTransfer = <DataTransfer>(event.target);
    if (target.files.length !== 1)
    {
      throw new Error('Cannot use multiple files');
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) =>
    {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      const wsname: string = wb.SheetNames[ 0 ];
      const ws: XLSX.WorkSheet = wb.Sheets[ wsname ];

      // Convert the worksheet data to a JSON array
      this.excelData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Initialize the groupedData array
      this.groupedData = [];
      let lastProjectEntry: { projectName: string; services: string[] } | null = null;

      this.excelData.forEach(row =>
      {
        const projectName = row[ 1 ]; // Assuming "Project Name" is in the 2nd column
        const serviceModule = row[ 2 ]; // Assuming "Service/Module" is in the 3rd column

        if (projectName)
        {
          // Find the project in groupedData
          const projectEntry = this.groupedData.find(project => project.projectName === projectName);

          if (projectEntry)
          {
            // If the project already exists, add the service
            if (serviceModule)
            {
              projectEntry.services.push(serviceModule);
            }
            lastProjectEntry = projectEntry; // Update lastProjectEntry to current project
          } else
          {
            // If the project does not exist, create a new entry
            const newProjectEntry = {
              projectName: projectName,
              services: serviceModule ? [ serviceModule ] : [] // Initialize with service if it exists
            };
            this.groupedData.push(newProjectEntry);
            lastProjectEntry = newProjectEntry; // Update lastProjectEntry to the newly created project
          }
        } else if (lastProjectEntry && serviceModule)
        {
          // If the project is missing, add the service to the last added project
          lastProjectEntry.services.push(serviceModule);
        }
      });

      this.groupedData.shift();

      this.ImportInDB();
    };

    reader.readAsBinaryString(target.files[ 0 ]);
  }

  async ImportInDB()
  {
    try
    {
      this.allProjects = await this.http.get<Project[]>(`${environment.apiUrl}/project`).toPromise() || [];
    } catch (err)
    {
      console.log(err);
      return;
    }

    // Check if each project in groupedData exists in allProjects
    for (let i = 0; i < this.groupedData.length; i++)
    {
      const project = this.groupedData[ i ];

      if (!this.allProjects.find(x => x.name === project.projectName))
      {
        this.addProjects(project);
      }
    }

    this.allProjects = await this.http.get<Project[]>(`${environment.apiUrl}/project`).toPromise() || [];

    for (let i = 0; i < this.groupedData.length; i++)
    {
      const project = this.groupedData[ i ];

      if (this.allProjects.find(x => x.name === project.projectName))
      {
        this.addServices(project);
      }
    }

    this.projectManagement.loadProjects();
  }

  async addProjects(project: { projectName: string; services: string[] })
  {
    try
    {
      const newProject =
      {
        name: project.projectName,
        status: "Active"
      }

      const createdProject = await this.http.post(`${environment.apiUrl}/project`, newProject).toPromise();
    }
    catch (err)
    {
      console.log(err);
    }
  }

  async addServices(project: { projectName: string; services: string[] })
  {
    try
    {
      const selectedProject = this.allProjects.find(x => x.name === project.projectName);
      const currentDate: Date = new Date();
      const nextWeekDate: Date = new Date(currentDate);
      nextWeekDate.setDate(currentDate.getDate() + 7);

      const token = localStorage.getItem("token");
      const decodedToken = jwtDecode(token!);

      if (project.services.length > 0 && selectedProject !== undefined)
      {
        // Fetch existing services for the selected project
        const existingServices: Service[] = selectedProject.services;

        const existingServiceNames = existingServices.map(service => service.name);

        for (let i = 0; i < project.services.length; i++)
        {
          const element = project.services[ i ];

          // Check if the service already exists
          if (!existingServiceNames.includes(element))
          {
            const newService = {
              name: element,
              description: "",
              projectId: selectedProject.projectID,
              deadline: nextWeekDate,
              chiefId: decodedToken.sub
            };

            await this.http.post(`${environment.apiUrl}/service`, newService).toPromise();
          }
          else
          {
            console.log(`Service "${element}" already exists. Skipping.`);
          }
        }
      }
    } catch (err)
    {
      console.log(err);
    }
  }

}