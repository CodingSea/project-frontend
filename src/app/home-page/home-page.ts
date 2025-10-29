import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import { Categories, CategoryClasses } from '@app/categories';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environments/environment';
import { CommonModule } from '@angular/common';
import { Issue } from '@app/issue';
import { Status, StatusClasses } from '@app/status';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home-page',
  imports: [ Sidebar, CommonModule, FormsModule ],
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
  searchQuery: string = '';

  selectedCategory: Categories = Categories.AllCategories;
  selectedStatus: Status = Status.All;

  ngOnInit()
  {
    this.updateTotalIssues();
    this.loadIssues();
  }

  loadIssues(): void
  {
    // Construct the query string manually
    const queryParams = new URLSearchParams();
    queryParams.append('page', this.currentPage.toString());
    queryParams.append('limit', this.pageSize.toString());

    if (this.selectedStatus !== Status.All)
    {
      queryParams.append('status', this.selectedStatus);
    }

    if (this.selectedCategory !== Categories.AllCategories)
    {
      queryParams.append('category', this.selectedCategory);
    }

    if (this.searchQuery)
    {
      queryParams.append('search', this.searchQuery);
    }

    this.http.get<Issue[]>(`${environment.apiUrl}/issue?${queryParams.toString()}`).subscribe(
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
    this.updatePageNumbers();
    this.loadIssues();
  }

  jumpToPage(firstPage: boolean): void
  {
    const totalPages = this.getTotalPages();  // Get total number of pages

    // Set the current page to either the first or last page
    if (firstPage)
    {
      this.currentPage = 1;  // Navigate to the first page
    }
    else
    {
      this.currentPage = totalPages;  // Navigate to the last page
    }

    // Update the page numbers and load the issues based on the new current page
    this.updatePageNumbers();
    this.loadIssues();
  }

  getTotalPages(): number
  {
    const totalPages = Math.ceil(this.totalIssues / this.pageSize);
    return totalPages || 1; // Ensure at least one page is returned
  }

  getTotalIssuesCount(): void
  {
    const queryParams = new URLSearchParams();
    if (this.selectedStatus !== Status.All)
    {
      queryParams.append('status', this.selectedStatus);
    }

    if (this.selectedCategory !== Categories.AllCategories)
    {
      queryParams.append('category', this.selectedCategory);
    }

    if (this.searchQuery)
    {
      queryParams.append('search', this.searchQuery);
    }

    this.http.get<number>(`${environment.apiUrl}/issue/count?${queryParams.toString()}`).subscribe(
      (count) =>
      {
        this.totalIssues = count; // Update the total issues count
        this.updatePageNumbers(); // Recalculate the page numbers
        this.loadIssues(); // Load issues based on updated filters
      },
      (err) =>
      {
        console.error('Error fetching total issues count:', err);
      }
    );
  }

  updatePageNumbers(): void
  {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentPage;

    this.pageNumbers = [];

    // Calculate the start and end page indexes
    let startPage = Math.max(1, currentPage - 2); // Start from 2 pages before the current page
    let endPage = Math.min(totalPages, currentPage + 2); // End at 2 pages after the current page

    // Ensure we always show exactly 5 pages
    if (endPage - startPage < 4)
    {
      if (currentPage <= 3)
      {
        endPage = Math.min(5, totalPages); // If near the start
      } else
      {
        startPage = Math.max(1, endPage - 4); // Adjust start page if near the end
      }
    }

    // Add pages to the pageNumbers array
    for (let i = startPage; i <= endPage; i++)
    {
      this.pageNumbers.push(i);
    }

    // Remove duplicates and sort the page numbers
    this.pageNumbers = Array.from(new Set(this.pageNumbers)).sort((a, b) => a - b);
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

  filteredIssues(): Issue[]
  {
    return this.issues;
  }

  onFilterChange(): void
  {
    console.log("pressed")
    this.currentPage = 1; // Reset to the first page when changing filters
    this.getTotalIssuesCount(); // Reload issues based on the new filters

  }

  checkText(): void
  {
    if (this.searchQuery == "")
    {
      console.log("none")
      this.currentPage = 1;
      this.getTotalIssuesCount();
    }
  }

}
