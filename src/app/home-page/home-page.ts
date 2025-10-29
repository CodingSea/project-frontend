import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import { Categories, CategoryClasses } from '@app/categories';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environments/environment';
import { CommonModule } from '@angular/common';
import { Issue } from '@app/issue';
import { Status, StatusClasses } from '@app/status';

@Component({
  selector: 'app-home-page',
  imports: [ Sidebar, CommonModule ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage implements OnInit
{
  constructor(private http: HttpClient, private activatedRoute: ActivatedRoute, private router: Router, private cdr: ChangeDetectorRef) { }

  categories: string[] = Object.values(Categories);
  status: string[] = Object.values(Status);

  issues: Issue[] = [];
  currentPage: number = 1;
  pageSize: number = 6;
  totalIssues: number = 0;
  pageNumbers: number[] = [];

  ngOnInit()
  {
    this.updateTotalIssues();
    this.loadIssues();
  }

  loadIssues(): void
  {
    this.http.get<Issue[]>(`${environment.apiUrl}/issue?page=${this.currentPage}&limit=${this.pageSize}`).subscribe(
      (res) =>
      {
        this.issues = res;

        this.cdr.markForCheck();
      },
      (err) =>
      {
        console.error('Error loading issues:', err);
      }
    );
  }

  updateTotalIssues(): void
  {
    this.http.get<number>(`${environment.apiUrl}/issue/count`).subscribe(
      (count) =>
      {
        this.totalIssues = count;
        this.updatePageNumbers();
      },
      (err) =>
      {
        console.error('Error fetching total issues:', err);
      }
    );
  }

  changePage(page: number): void
  {
    if (page < 1 || page > this.getTotalPages()) return;
    this.currentPage = page;
    this.loadIssues();
  }

  getTotalPages(): number
  {
    const totalPages = Math.ceil(this.totalIssues / this.pageSize);
    return totalPages || 1; // Ensure at least one page is returned
  }

  updatePageNumbers(): void
  {
    const totalPages = this.getTotalPages();
    this.pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1); // Create an array of page numbers
  }

  getTimeAgo(issue: Issue): string
  {
    // Convert createdAt to Date if it's a string
    const createdAt: Date = typeof issue.createdAt === 'string' ? new Date(issue.createdAt) : issue.createdAt;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);

    // Check if the time is more than a week (7 days)
    if (seconds >= 7 * 24 * 60 * 60)
    {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return createdAt.toLocaleDateString(undefined, options); // Format the date
    }

    // Calculate intervals for time less than a week
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + ' year' + (interval === 1 ? '' : 's') + ' ago';

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + ' month' + (interval === 1 ? '' : 's') + ' ago';

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + ' day' + (interval === 1 ? '' : 's') + ' ago';

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + ' hour' + (interval === 1 ? '' : 's') + ' ago';

    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + ' minute' + (interval === 1 ? '' : 's') + ' ago';

    return seconds + ' second' + (seconds === 1 ? '' : 's') + ' ago';
  }

  getCategoryClass(category: Categories): string
  {
    return CategoryClasses[ category ];
  }

  getStatusClass(status: Status): string
  {
    return StatusClasses[ status ];
  }

}
