import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from "@app/sidebar/sidebar";
import { User } from '@app/user';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-developers.search.component',
  imports: [ Sidebar ],
  templateUrl: './developers.search.component.html',
  styleUrl: './developers.search.component.css'
})
export class DevelopersSearchComponent
{
  constructor(private http: HttpClient, private router: Router) { }

  developers: User[] | null = null;

  ngOnInit()
  {
    this.http.get<User[]>(`${environment.apiUrl}/user/developers`).subscribe(
      (response) =>
      {
        this.developers = response;
      },
      (error) =>
      {
        console.log(error);
      }
    )
  }

  viewProfile(userId: number)
  {
    this.router.navigate([ `/profile/user/${userId}` ]);
  }

}
