import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@app/auth';
import { RouterModule } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit
{
  activeLink: string = '';

  isAdmin: boolean = false;
  decodedToken: any;

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit()
  {
    this.setActiveLink(this.router.url);

    const token: string | null = localStorage.getItem("token");
    if (token)
    {
      this.decodedToken = jwtDecode(token);

      if(this.decodedToken.role == "admin")
      {
        this.isAdmin = true;
      }
    }
    this.router.events.subscribe(event =>
    {
      if (event instanceof NavigationEnd)
      {
        this.setActiveLink(event.url);
      }
    });
  }

  setActiveLink(url: string)
  {
    if (url.startsWith('/dashboard'))
    {
      this.activeLink = 'dashboard';
    }
    else if (url.startsWith('/projects') || url.startsWith('/services'))
    {
      this.activeLink = 'projectManagement';
    }
    else if (url.startsWith('/profile') || url.startsWith('/certificate'))
    {
      this.activeLink = 'profile';
    }
    else if (url.startsWith('/home') || url.startsWith('/issues'))
    {
      this.activeLink = 'home';
    }
    else
    {
      this.activeLink = '';
    }
  }


  logout()
  {
    this.auth.logout();
    this.router.navigate([ '/auth/login' ]);
  }
}
