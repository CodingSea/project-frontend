import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import { Categories, CategoryClasses } from '@app/categories';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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

  constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) { }

  categories = Object.values(Categories);
  status = Object.values(Status);

  issues: Issue[] = [];
  currentPage: number = 1;
  pageSize: number = 6;
  totalIssues: number = 0;
  pageNumbers: number[] = [];
  searchQuery: string = '';

  selectedCategory: Categories = Categories.All;
  selectedStatus: Status = Status.All;

  ngOnInit()
  {
    this.loadData();
  }

  buildQueryParams(): string
  {
    const params = new URLSearchParams();
    params.append('page', this.currentPage.toString());
    params.append('limit', this.pageSize.toString());
    params.append('status', this.selectedStatus);
    params.append('category', this.selectedCategory);

    if (this.searchQuery.trim() !== '')
    {
      params.append('search', this.searchQuery.trim());
    }

    return params.toString();
  }

  loadData(): void
  {
    const queryParams = new URLSearchParams();
    queryParams.append('page', this.currentPage.toString());
    queryParams.append('limit', this.pageSize.toString());

    if (this.selectedStatus !== Status.All)
    {
      queryParams.append('status', this.selectedStatus);
    }

    if (this.selectedCategory !== Categories.All)
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

  stripMarkdown(text: string): string
  {
    if (!text) return '';

    return text
      .replace(/[#_*~`>-]/g, '')          // remove markdown symbols
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // remove markdown links but keep text
      .replace(/!\[(.*?)\]\((.*?)\)/g, '')  // remove images completely
      .replace(/<\/?[^>]+(>|$)/g, '')       // remove HTML tags
      .trim();
  }

  onFilterChange(): void
  {
    this.currentPage = 1;
    this.loadData();
  }

  changePage(page: number): void
  {
    if (page < 1 || page > this.getTotalPages()) return;
    this.currentPage = page;
    this.loadData();
  }

  jumpToPage(firstPage: boolean): void
  {
    this.currentPage = firstPage ? 1 : this.getTotalPages();
    this.loadData();
  }

  getTotalPages(): number
  {
    return Math.ceil(this.totalIssues / this.pageSize) || 1;
  }

  updatePageNumbers(): void
  {
    const total = this.getTotalPages();
    const curr = this.currentPage;
    this.pageNumbers = [];

    let start = Math.max(1, curr - 2);
    let end = Math.min(total, curr + 2);

    if (end - start < 4)
    {
      if (curr <= 3) end = Math.min(5, total);
      else start = Math.max(1, end - 4);
    }

    for (let i = start; i <= end; i++) this.pageNumbers.push(i);
  }

  getCategoryClass(category: Categories): string
  {
    return CategoryClasses[ category ];
  }

  getStatusClass(status: Status): string
  {
    return StatusClasses[ status ];
  }

  getTimeAgo(issue: Issue): string
  {
    const createdAt: any = typeof issue.createdAt === 'string' ? new Date(issue.createdAt) : issue.createdAt;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - createdAt.getTime()) / 1000);

    if (seconds >= 7 * 24 * 60 * 60)
    {
      return createdAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const units = [
      { t: 31536000, l: 'year' },
      { t: 2592000, l: 'month' },
      { t: 86400, l: 'day' },
      { t: 3600, l: 'hour' },
      { t: 60, l: 'minute' }
    ];

    for (const u of units)
    {
      const v = Math.floor(seconds / u.t);
      if (v >= 1) return `${v} ${u.l}${v > 1 ? 's' : ''} ago`;
    }

    return `${seconds} seconds ago`;
  }

  openIssue(id: number): void
  {
    this.router.navigate([ '/issues', id ]);
  }

  goToCreateIssue(): void
  {
    this.router.navigate([ '/issues/create' ]);
  }
}
