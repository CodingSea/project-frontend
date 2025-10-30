import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import { IssueService, Issue } from '../services/issue.service';
import { Sidebar } from '@app/sidebar/sidebar';

@Component({
  selector: 'app-issue-page',
  standalone: true,
  imports: [CommonModule, Sidebar, HttpClientModule],
  templateUrl: './issue-page.html',
  styleUrls: ['./issue-page.css'],
})
export class IssuePage implements AfterViewInit, OnInit {
  issues: Issue[] = [];
  loading = true;
  error = '';

  constructor(private issueService: IssueService) {}

  ngOnInit(): void {
    this.loadIssues();
  }

  ngAfterViewInit(): void {
    // Highlight code blocks after DOM updates
    setTimeout(() => Prism.highlightAll(), 100);
  }

  /** ✅ Load issues from backend */
  loadIssues(): void {
    this.loading = true;

    this.issueService.getAllIssues().subscribe({
      next: (data: Issue[]) => {
        this.issues = data;
        this.loading = false;

        // highlight after data is loaded
        setTimeout(() => Prism.highlightAll(), 100);
      },
      error: (err: any) => {
        console.error('❌ Failed to load issues', err);
        this.error = 'Failed to load issues. Check your backend connection.';
        this.loading = false;
      },
    });
  }

  /** ✅ Copy code block to clipboard */
  copyCode(event: Event): void {
    const button = event.target as HTMLElement;
    const pre = button.closest('.code-container')?.querySelector('pre');

    if (!pre) return;

    const text = pre.textContent?.trim() || '';
    navigator.clipboard.writeText(text);

    button.textContent = '✅ Copied';
    setTimeout(() => (button.textContent = 'Copy code'), 1500);
  }
}
