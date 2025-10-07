import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class HeaderComponent {
  title = 'ProjectHub';
  avatarUrl = 'assets/avatar.jpg'; // put your real image path here
  hasUnread = true;                // set to false to hide the red dot
}
