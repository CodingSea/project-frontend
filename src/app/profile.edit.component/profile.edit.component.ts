import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { Sidebar } from "@app/sidebar/sidebar";
import { User } from '@app/user';
import { environment } from '@environments/environment';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile.edit.component',
  imports: [ Sidebar, ReactiveFormsModule, CommonModule ],
  templateUrl: './profile.edit.component.html',
  styleUrl: './profile.edit.component.css'
})
export class ProfileEditComponent 
{
  editForm: FormGroup;
  decodedToken: any | null = null;

  constructor(private http: HttpClient, private router: Router)
  {
    this.editForm = new FormGroup(
      {
        first_name: new FormControl<string>("", Validators.required),
        last_name: new FormControl<string>("", Validators.required),
        skills: new FormArray([], Validators.required),
      }
    )
  }

  currentUser: User | null = null;



  ngOnInit()
  {
    const token: string | null = localStorage.getItem("token");
    if (token !== null) 
    {
      this.decodedToken = jwtDecode(token)

      this.http.get<User>(`${environment.apiUrl}/user/${this.decodedToken.sub}`).subscribe(
        (response) =>
        {
          this.currentUser = response;
          this.editForm.patchValue(
            {
              first_name: this.currentUser.first_name,
              last_name: this.currentUser.last_name
            }
          )

          this.clearSkills();
          this.currentUser.skills?.forEach(skill => this.addSkill(skill));
        },
        (error) =>
        {
          console.log(error);
        }
      )
    }
  }

  get skills(): FormArray
  {
    return this.editForm.get('skills') as FormArray;
  }

  clearSkills()
  {
    while (this.skills.length !== 0)
    {
      this.skills.removeAt(0);
    }
  }

  addSkill(skill: string = '')
  {
    const skillControl = new FormControl(skill, Validators.required);
    this.skills.push(skillControl);
  }

  removeSkill(index: number)
  {
    this.skills.removeAt(index);
  }

  onSubmit()
  {
    
    const updatedUser =
    {
      ...this.editForm.value,
      skills: this.editForm.value.skills
    }

    this.http.put(`${environment.apiUrl}/user/${this.decodedToken.sub}`, updatedUser).subscribe(
      (response) =>
      {
        this.router.navigate(['/profile']);
      },
      (error) =>
      {
        console.log(error);
      }
    )
  }

}
