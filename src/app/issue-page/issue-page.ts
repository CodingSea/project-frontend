import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Sidebar } from '@app/sidebar/sidebar';
import { HeaderComponent } from '@app/header/header';
import { IssuePageTemplate } from './issue-page-template';

@Component({
  selector: 'app-issue-page',
  standalone: true,
  imports: [
    CommonModule,
    Sidebar,
    HeaderComponent,
    HttpClientModule,
    FormsModule,
    IssuePageTemplate,
  ],
  templateUrl: './issue-page.html',
  styleUrls: ['./issue-page.css'],
})
export class IssuePage {}
