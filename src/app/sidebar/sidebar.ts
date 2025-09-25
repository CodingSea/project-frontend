import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/auth';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar 
{
  constructor(private auth: AuthService, private router: Router) {}

  logout()
  {
    this.auth.logout();
    this.router.navigate([ '/login' ]);
  }
}
