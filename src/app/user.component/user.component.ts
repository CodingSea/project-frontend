import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '@app/user';
import { Observable } from 'rxjs';
import { AuthService } from "../auth"
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { environment } from '@environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'user-component',
  imports: [ ReactiveFormsModule, RouterLink, CommonModule ],
  templateUrl: './user.component.html',
  styleUrls: [ './user.component.css' ]  // Ensure this is styleUrls
})
export class UserComponent
{
  createMode: boolean = true;
  loginError: string | null = null; // To hold the error message
  signupError: string | null = null; // To hold signup error messages

  constructor(private http: HttpClient, private activatedRoute: ActivatedRoute, private router: Router, private authService: AuthService) { }

  ngOnInit()
  {
    this.activatedRoute.paramMap.subscribe((params: ParamMap) =>
    {
      const mode = this.activatedRoute.snapshot.paramMap.get("mode");
      this.createMode = (mode === "signup");
    });
  }

  signupForm = new FormGroup({
    first_name: new FormControl<string>("", Validators.required),
    last_name: new FormControl<string>("", Validators.required),
    email: new FormControl<string>("", [ Validators.required, Validators.email ]),
    password: new FormControl<string>("", [ Validators.required, Validators.minLength(5) ]),
  });

  loginForm = new FormGroup({
    email: new FormControl<string>("", [ Validators.required, Validators.email ]),
    password: new FormControl<string>("", Validators.required),
  });

  signup()
  {
    if (this.signupForm.valid)
    {
      const user = this.signupForm.value as User;

      this.addUser(user).subscribe(
        (response) =>
        {
          this.router.navigate([ '/login' ]);
        },
        (error) =>
        {
          this.signupError = 'Signup failed. Please try again later.'; // Handle signup errors
          console.log(error);
        }
      );
    } else
    {
      this.signupError = 'Please provide a valid email and a password with at least 5 characters.';
    }
  }

  addUser(newUser: User): Observable<User>
  {
    return this.http.post<User>(`${environment.apiUrl}/user`, newUser);
  }

  login()
  {
    const email = this.loginForm.value.email ?? '';
    const password = this.loginForm.value.password ?? '';

    this.authService.login(email, password).subscribe({
      next: () =>
      {
        this.router.navigate([ '/profile' ]);
        this.loginError = null; // Clear error on successful login
      },
      error: (err) =>
      {
        this.loginError = 'Invalid email or password.'; // Set error message
        console.error(err);
      }
    });
  }
}