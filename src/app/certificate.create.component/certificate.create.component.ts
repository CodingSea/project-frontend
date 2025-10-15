import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Certificate } from '@app/certificate';
import { Sidebar } from "@app/sidebar/sidebar";
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-certificate.create.component',
  imports: [ Sidebar, RouterLink, ReactiveFormsModule, CommonModule ],
  templateUrl: './certificate.create.component.html',
  styleUrl: './certificate.create.component.css'
})
export class CertificateCreateComponent
{
  certificateForm: FormGroup;
  decodedToken: any | null = null;

  constructor(private http: HttpClient, private router: Router, private fb: FormBuilder)
  {
    this.certificateForm = this.fb.group(
      {
        name: [ '', Validators.required ],
        type: [ '', Validators.required ],
        issuingOrganization: [ '', Validators.required ],
        issueDate: [ '', Validators.required ],
        expiryDate: [ '', Validators.required ],
        description: [ '' ],
      }
    )
  }

  onSubmit(): void
  {
    const token: string | null = localStorage.getItem("token");

    if (this.certificateForm.valid && token)
    {
      console.log('Form Values:', this.certificateForm.value);

      this.decodedToken = jwtDecode(token);

      // Prepare the certificate object with proper date formatting
      const certificate: Certificate = {
        name: this.certificateForm.value.name,
        type: this.certificateForm.value.type,
        issuingOrganization: this.certificateForm.value.issuingOrganization,
        issueDate: new Date(this.certificateForm.value.issueDate).toISOString(),
        expiryDate: new Date(this.certificateForm.value.expiryDate).toISOString(),
        description: this.certificateForm.value.description ? this.certificateForm.value.description : ""
      };

      console.log('Submitting Certificate:', certificate);

      this.http.post(`${environment.apiUrl}/certificate/${this.decodedToken.sub}`, certificate).subscribe(
        (response) =>
        {
          console.log(response);
          this.router.navigate([ "/profile" ]);
        },
        (error) =>
        {
          console.log('Submission Error:', error);
        }
      );
    } else
    {
      console.log('Form is invalid', this.certificateForm.errors);
    }
  }

  // onFileChange(event: any): void
  // {
  //   const file = event.target.files[ 0 ];
  //   this.certificateForm.patchValue({
  //     certificateFile: file
  //   });
  // }

}
