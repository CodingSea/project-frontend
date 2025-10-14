import { Component } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import { HttpClient } from '@angular/common/http';
import { User } from '@app/user';
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { Certificate } from '@app/certificate';
import { Service } from '@app/service';

@Component({
  selector: 'app-profile.component',
  imports: [ Sidebar, RouterLink ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent
{
  isCurrentUser: boolean = false;

  constructor(private http: HttpClient, private activatedRoute: ActivatedRoute, private router: Router) { }

  currentUserInfo = {
    username: "",
    email: "",
    role: "",
    skills: [] as string[]
  };

  currentUser: User | null = null;
  certificates: Certificate[] | null = null;
  services: Service[] | null = null;

  ngOnInit()
  {
    const token: string | null = localStorage.getItem("token");
    if (token !== null)
      this.activatedRoute.queryParamMap.subscribe((params: ParamMap) =>
      {
        if (this.activatedRoute.snapshot.paramMap.has("userId"))
        {
          this.isCurrentUser = false;
          const userId = this.activatedRoute.snapshot.paramMap.get('userId');

          const token: string | null = localStorage.getItem("token");
          if (token !== null)
          {
            const decodedToken: any = jwtDecode(token);
            this.isCurrentUser = decodedToken.sub == userId;
          }

          // ✅ Fetch user info
          this.http.get<User>(`${environment.apiUrl}/user/${userId}`).subscribe(
            (response) =>
            {
              this.currentUser = response;

              this.currentUserInfo.username = this.currentUser.first_name + " " + this.currentUser.last_name;
              this.currentUserInfo.email = this.currentUser.email;
              this.currentUserInfo.skills = this.currentUser.skills;

              if (this.currentUser.role === "admin")
              {
                this.currentUserInfo.role = "Admin";
              } else if (this.currentUser.role === "developer")
              {
                this.currentUserInfo.role = "Developer";
              }
            },
            (error) =>
            {
              console.log(error);
            }
          );

          // ✅ Fetch certificates
          this.http.get<Certificate[]>(`${environment.apiUrl}/certificate/${userId}`).subscribe(
            (response) =>
            {
              this.certificates = response;
            },
            (error) =>
            {
              console.log(error);
            }
          );

          // ✅ Fetch services (PLURAL FIX)
          this.http.get<Service[]>(`${environment.apiUrl}/service/user/${userId}`).subscribe(
            (response) =>
            {
              if (response.length === 0)
              {
                console.log("no services found");
              } else
              {
                this.services = response;
              }
            },
            (error) =>
            {
              console.log(error);
            }
          );
        }
        else
        {
          // ✅ Current user profile (decoded from token)
          this.isCurrentUser = true;
          const token: string | null = localStorage.getItem("token");
          if (token !== null)
          {
            const decodedToken: any = jwtDecode(token);

            if (decodedToken.role === "admin")
            {
              this.currentUserInfo.role = "Admin";
            } else if (decodedToken.role === "developer")
            {
              this.currentUserInfo.role = "Developer";
            }

            // ✅ Fetch user info
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
            );

            // ✅ Fetch certificates
            this.http.get<Certificate[]>(`${environment.apiUrl}/certificate/${decodedToken.sub}`).subscribe(
              (response) =>
              {
                this.certificates = response;
              },
              (error) =>
              {
                console.log(error);
              }
            );

            // ✅ Fetch services (PLURAL FIX)
            this.http.get<Service[]>(`${environment.apiUrl}/service/user/${decodedToken.sub}`).subscribe(
              (response) =>
              {
                if (response.length === 0)
                {
                  console.log("no services found");
                } else
                {
                  this.services = response;
                  
                  console.log(this.services);
                }
              },
              (error) =>
              {
                console.log(error);
              }
            );
          }
        }
      });
  }

  switchPage(serviceId: number, taskBoardId?: number)
  {
    this.router.navigate([`/services/${serviceId}/taskboard/${taskBoardId}`])
  }
}
