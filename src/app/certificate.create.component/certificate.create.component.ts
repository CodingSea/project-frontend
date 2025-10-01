import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Certificate } from '@app/certificate';
import { Sidebar } from "@app/sidebar/sidebar";
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-certificate.create.component',
  imports: [ Sidebar, RouterLink, ReactiveFormsModule ],
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
        expiryDate: [ '' ],
        description: [ '' ],
      }
    )
  }

  onSubmit(): void
  {
    const token: string | null = localStorage.getItem("token");

    if (this.certificateForm.valid && token)
    {
      console.log('Form Submitted', this.certificateForm.value);

      
      this.decodedToken = jwtDecode(token)

      const certificate: Certificate = this.certificateForm.value;

      this.http.post<Certificate>(`${environment.apiUrl}/certificate/${this.decodedToken.sub}`, certificate).subscribe(
        (response) =>
        {
          
        },
        (error) =>
        {
          console.log(error);
        }
      )

    } else
    {
      console.log('Form is invalid');
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
