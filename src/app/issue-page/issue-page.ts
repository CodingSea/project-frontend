import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import { IssueService, Issue } from '../services/issue.service';
import { Sidebar } from '@app/sidebar/sidebar';
import { marked } from 'marked';
import { ActivatedRoute } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from '@environments/environment';
import { IssuePageTemplate } from './issue-page-template';

@Component({
  selector: 'app-issue-page',
  standalone: true,
  imports: [CommonModule, Sidebar, HttpClientModule, FormsModule, IssuePageTemplate],
  templateUrl: './issue-page.html',
  styleUrls: ['./issue-page.css'],
})
export class IssuePage
{

}
