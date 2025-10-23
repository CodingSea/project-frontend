import { Component, OnInit } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import { HttpClient } from '@angular/common/http';
import { User } from '@app/user';
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { Certificate } from '@app/certificate';
import { Service } from '@app/service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile.component',
  imports: [ Sidebar, RouterLink, CommonModule, FormsModule ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit
{
  isCurrentUser = false;
  isEditing = false;
  currentUser: User | null = null;
  certificates: Certificate[] | null = null;
  services: Service[] | null = null;
  isEmbedded = false;
  isImageLoading = true;

  newSkill = '';

  currentUserInfo = {
    username: "",
    email: "",
    role: "",
    skills: [] as string[],
    profileImage: ""
  };

  decodedToken: any | null = null;

  constructor(private http: HttpClient, private activatedRoute: ActivatedRoute, private router: Router) { }

  ngOnInit()
  {
    this.isEmbedded = window !== window.parent;
    const token: string | null = localStorage.getItem("token");
    if (!token) return;
    this.decodedToken = jwtDecode(token);

    this.activatedRoute.queryParamMap.subscribe(() =>
    {
      if (this.activatedRoute.snapshot.paramMap.has("userId"))
      {
        this.loadOtherUserProfile();
      } else
      {
        this.loadCurrentUserProfile();
      }
    });
  }

  loadOtherUserProfile()
  {
    const userId = this.activatedRoute.snapshot.paramMap.get('userId');
    if (!userId) return;

    this.isCurrentUser = this.decodedToken.sub == userId;

    this.http.get<User>(`${environment.apiUrl}/user/${userId}`).subscribe((res) => this.setUserData(res));
    this.http.get<Certificate[]>(`${environment.apiUrl}/certificate/${userId}`).subscribe((res) => (this.certificates = res));
    this.http.get<Service[]>(`${environment.apiUrl}/service/user/${userId}`).subscribe((res) => (this.services = res));
  }

  loadCurrentUserProfile()
  {
    const userId = this.decodedToken.sub;

    this.isCurrentUser = true;
    this.http.get<User>(`${environment.apiUrl}/user/${userId}`).subscribe((res) => this.setUserData(res));
    this.http.get<Certificate[]>(`${environment.apiUrl}/certificate/${userId}`).subscribe((res) => (this.certificates = res));
    this.http.get<Service[]>(`${environment.apiUrl}/service/user/${userId}`).subscribe((res) => (this.services = res));
  }

  setUserData(user: User)
  {
    this.currentUser = user;
    this.currentUserInfo.username = `${user.first_name} ${user.last_name}`;
    this.currentUserInfo.email = user.email;
    this.currentUserInfo.skills = user.skills || [];
    this.currentUserInfo.profileImage = user.profileImage || '';
    this.currentUserInfo.role = user.role === "admin" ? "Admin" : "Developer";
    this.isImageLoading = false;
  }

  // === Edit Mode ===
  toggleEdit()
  {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.currentUser)
    {
      this.loadCurrentUserProfile(); // revert if canceled
    }
  }

  addSkill()
  {
    if (this.newSkill.trim())
    {
      this.currentUserInfo.skills.push(this.newSkill.trim());
      this.newSkill = '';
    }
  }

  removeSkill(i: number)
  {
    this.currentUserInfo.skills.splice(i, 1);
  }

  saveProfile()
  {
    if (!this.currentUser) return;

    const updatePayload = {
      first_name: this.currentUser.first_name,
      last_name: this.currentUser.last_name,
      skills: this.currentUserInfo.skills
    };

    this.http.put(`${environment.apiUrl}/user/${this.decodedToken.sub}`, updatePayload).subscribe({
      next: () =>
      {
        alert('✅ Profile updated successfully!');
        this.isEditing = false;
        this.loadCurrentUserProfile();
      },
      error: (err) => console.error('❌ Update failed', err)
    });
  }

  // === Image ===
  onImageLoad() { this.isImageLoading = false; }
  onImageError() { this.isImageLoading = false; }

  onProfileImageSelected(event: any)
  {
    const file = event.target.files[ 0 ];
    if (!file) return;
    const userId = this.decodedToken.sub;

    const formData = new FormData();
    formData.append('file', file);

    this.http.post(`${environment.apiUrl}/user/${userId}/profile-image`, formData).subscribe({
      next: () =>
      {
        alert('✅ Profile image updated!');
        this.loadCurrentUserProfile();
      },
      error: (err) => console.error('❌ Upload failed', err)
    });
  }

  switchPage(serviceId: number, taskBoardId?: number)
  {
    this.router.navigate([ `/services/${serviceId}/taskboard/${taskBoardId}` ]);
    window.scrollTo(0, 0);
  }

  async removeCertificate(i: number) 
  {
    try
    {
      await this.http.delete(`${environment.apiUrl}/certificate/${i}`).toPromise();

      this.loadCurrentUserProfile();
    }
    catch(err)
    {
      console.log(err);
    }
  }

}
