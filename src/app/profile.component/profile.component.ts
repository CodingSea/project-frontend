import { Component, OnInit, ViewChild } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import { HttpClient } from '@angular/common/http';
import { User } from '@app/user';
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Certificate } from '@app/services/certificate.service';
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
  @ViewChild('fileInput') fileInputRef!: any;

  isCurrentUser = false;
  isEditing = false;
  currentUser: User | null = null;
  certificates: Certificate[] = [];
  displayedCertificates: Certificate[] = [];
  editModeCertificates: Certificate[] = [];
  services: Service[] | null = null;
  isEmbedded = false;
  isImageLoading = true;

  newSkill = '';
  deletedCertificates: number[] = [];
  showImageOptions = false;

  // ===== Image-related variables =====
  pendingImageFile: File | null = null;
  originalImage: string | null = null;
  previewImage: string | null = null;
  imageRemoved: boolean = false;

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

  // ===== LOAD USER DATA =====
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

  // ===== EDIT MODE =====
  toggleEdit()
  {
    this.isEditing = !this.isEditing;

    if (this.isEditing)
    {
      this.originalImage = this.currentUserInfo.profileImage;
      this.previewImage = this.currentUserInfo.profileImage;
    } else
    {
      // Cancel pressed
      this.previewImage = this.originalImage;
      this.currentUserInfo.profileImage = this.originalImage || '';
      this.pendingImageFile = null;
      this.imageRemoved = false;
      this.showImageOptions = false;
      this.deletedCertificates = [];
      if (this.currentUser) this.loadCurrentUserProfile();
    }
  }

  // ===== SKILLS =====
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

  // ===== CERTIFICATES =====
  removeCertificateTemp(index: number)
  {
    const cert = this.certificates?.[ index ];
    if (cert && cert.certificateID) this.deletedCertificates.push(cert.certificateID);
    this.certificates?.splice(index, 1);
  }

  editCertificate(certId: any)
  {
    if (!certId) return;
    this.router.navigate([ `/certificate/edit/${certId}` ]);
  }

  // ===== PROFILE IMAGE =====
  onImageLoad() { this.isImageLoading = false; }
  onImageError() { this.isImageLoading = false; }

  onProfileImageClick()
  {
    if (this.isEditing && (this.previewImage || this.currentUserInfo.profileImage))
    {
      this.showImageOptions = !this.showImageOptions;
    }
  }

  triggerChangeImage()
  {
    const input = this.fileInputRef?.nativeElement;
    if (input) input.click();
    this.showImageOptions = false;
  }

  onProfileImageSelected(event: any)
  {
    const file = event.target.files[ 0 ];
    if (!file) return;

    //  Allow only image files
    const allowedTypes = [ 'image/jpeg', 'image/png', 'image/webp', 'image/gif' ];
    if (!allowedTypes.includes(file.type))
    {
      alert('❌ Only image files (JPG, PNG, GIF, WebP) are allowed.');
      return;
    }

    // Preview image locally before saving
    const reader = new FileReader();
    reader.onload = () =>
    {
      this.previewImage = reader.result as string;
      this.currentUserInfo.profileImage = this.previewImage!;
      this.imageRemoved = false;
    };
    reader.readAsDataURL(file);

    this.pendingImageFile = file;
    this.showImageOptions = false;
  }

  removeTempImage()
  {
    this.previewImage = null;
    this.currentUserInfo.profileImage = '';
    this.pendingImageFile = null;
    this.imageRemoved = true; // Mark for deletion on save
    this.showImageOptions = false;
  }

  closeImageOptions(event: MouseEvent)
  {
    const target = event.target as HTMLElement;
    if (target.classList.contains('image-options-overlay'))
    {
      this.showImageOptions = false;
    }
  }

  // ===== SAVE PROFILE =====
  async saveProfile()
  {
    if (!this.currentUser) return;
    const userId = this.decodedToken.sub;

    const updatePayload = {
      first_name: this.currentUser.first_name,
      last_name: this.currentUser.last_name,
      skills: this.currentUserInfo.skills
    };

    try
    {
      // Remove profile image if marked
      if (this.imageRemoved)
      {
        await this.http.delete(`${environment.apiUrl}/user/${userId}/profile-image`).toPromise();
        this.imageRemoved = false;
      }

      // Upload new image if selected
      if (this.pendingImageFile)
      {
        const formData = new FormData();
        formData.append('file', this.pendingImageFile);
        await this.http.post(`${environment.apiUrl}/user/${userId}/profile-image`, formData).toPromise();
        this.pendingImageFile = null;
      }

      // Delete marked certificates
      if (this.deletedCertificates.length > 0)
      {
        for (const certId of this.deletedCertificates)
        {
          try
          {
            await this.http.delete(`${environment.apiUrl}/certificate/${certId}`).toPromise();
          } catch (err)
          {
            console.warn(`⚠️ Failed to delete certificate ${certId}:`, err);
          }
        }
        this.deletedCertificates = [];
      }

      // Update profile info
      await this.http.put(`${environment.apiUrl}/user/${userId}`, updatePayload).toPromise();

      alert('✅ Profile updated successfully!');
      this.isEditing = false;
      this.pendingImageFile = null;
      this.originalImage = this.currentUserInfo.profileImage;
      this.showImageOptions = false;
      this.loadCurrentUserProfile();
    } catch (err)
    {
      console.error('❌ Error saving profile:', err);
    }
  }

  // ===== SERVICES =====
  switchPage(serviceId: number, taskBoardId?: number)
  {
    this.router.navigate([ `/services/${serviceId}/taskboard/${taskBoardId}` ]);
    window.scrollTo(0, 0);
  }
}
