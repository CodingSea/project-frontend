import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '@app/user';
import { Observable } from 'rxjs';
import { AuthService } from "../auth"
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

@Component({
  selector: 'user-component',
  imports: [ ReactiveFormsModule ],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent
{
  createMode: boolean = true;

  constructor(private http: HttpClient, private activatedRoute: ActivatedRoute, private router: Router, private authService: AuthService) { }

  ngOnInit()
  {
    this.activatedRoute.paramMap.subscribe((params: ParamMap) =>
    {
      const mode = this.activatedRoute.snapshot.paramMap.get("mode");
      if (mode == "signup")
      {
        this.createMode = true;
      }
      else if (mode == "login")
      {
        this.createMode = false;
      }
      console.log(mode);
    });
  }

  signupForm = new FormGroup(
    {
      first_name: new FormControl<string>("", Validators.required),
      last_name: new FormControl<string>("", Validators.required),
      email: new FormControl<string>("", [ Validators.required, Validators.email ]),
      password: new FormControl<string>("", Validators.required),
    }
  )

  loginForm = new FormGroup(
    {
      email: new FormControl<string>("", [ Validators.required, Validators.email ]),
      password: new FormControl<string>("", Validators.required),
    }
  )

  signup()
  {
    const user = this.signupForm.value as User;

    this.addUser(user).subscribe(
      (response) =>
      {
        this.router.navigate([ '/login' ])
      },
      (error) =>
      {
        console.log(error);
      }
    )
  }

  addUser(newUser: User): Observable<User>
  {
    return this.http.post<User>("http://localhost:3000/user", newUser);
  }

  login()
  {
    const email = this.loginForm.value.email ?? '';
    const password = this.loginForm.value.password ?? '';

    console.log(this.loginForm.value)

    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate([ '/dashboard' ]),
      error: (err) =>
      {
        console.error(err);
      }
    });
  }

}
