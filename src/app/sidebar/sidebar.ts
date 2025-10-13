import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@app/auth';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ RouterLink ,RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar implements OnInit
{
  activeLink: string = '';

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit()
  {
    this.setActiveLink(this.router.url);

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
    if (url.includes('/home'))
    {
      this.activeLink = 'dashboard';
    }
    else if (url.includes('/projects'))
    {
      this.activeLink = 'projectManagement';
    }
    else if (url.includes('/profile'))
    {
      this.activeLink = 'profile';
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
