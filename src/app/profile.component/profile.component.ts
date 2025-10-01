import { Component } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import { HttpClient } from '@angular/common/http';
import { User } from '@app/user';
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Observable } from 'rxjs';
import { RouterLink } from '@angular/router';
import { Certificate } from '@app/certificate';

@Component({
  selector: 'app-profile.component',
  imports: [ Sidebar, RouterLink ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent
{
  constructor(private http: HttpClient) { }

  currentUserInfo =
    {
      username: "",
      email: "",
      role: "",
      skills: [] as string[]
    }

  currentUser: User | null = null;
  certificates: Certificate[] | null = null;

  ngOnInit()
  {
    const token: string | null = localStorage.getItem("token");
    if (token !== null) 
    {
      const decodedToken: any = jwtDecode(token)
      if (decodedToken.role === "admin")
      {
        this.currentUserInfo.role = "Admin";
      }
      else if (decodedToken.role === "developer")
      {
        this.currentUserInfo.role = "Developer";
      }

      this.http.get<User>(`${environment.apiUrl}/user/${decodedToken.sub}`).subscribe(
        (response) =>
        {
          this.currentUser = response;

          this.currentUserInfo.username = this.currentUser.first_name + " " + this.currentUser.last_name;
          this.currentUserInfo.email = this.currentUser.email;
          this.currentUserInfo.skills = this.currentUser.skills;
        },
        (error) =>
        {
          console.log(error);
        }
      )

      this.http.get<Certificate[]>(`${environment.apiUrl}/certificate/${decodedToken.sub}`).subscribe(
        (response) =>
        {
          console.log(response);
          this.certificates = response;
        },
        (error) =>
        {
          console.log(error);
        }
      )
    }
  }

}
