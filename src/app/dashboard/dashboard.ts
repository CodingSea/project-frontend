import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Project } from '@app/project';
import { Sidebar } from "@app/sidebar/sidebar";
import { environment } from '@environments/environment';

@Component({
  selector: 'app-dashboard',
  imports: [ Sidebar ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard
{
  constructor(private http: HttpClient, private router: Router) { }

  projects: Project[] | null = null;

  listProjects()
  {
    this.http.get<Project[]>(`${environment.apiUrl}/project`).subscribe(
      (response) =>
      {
        this.projects = response;
      },
      (error) =>
      {
        console.log(error);
      }
    )
  }

  ngOnInit()
  {
    this.listProjects();
  }
}
