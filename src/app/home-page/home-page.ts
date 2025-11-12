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
import { HeaderComponent } from '@app/header/header';
import { Service } from '@app/service';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'app-home-page',
  imports: [ Sidebar, CommonModule, FormsModule, HeaderComponent ],
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

  selectedCategory: Categories = Categories.AllCategories;
  selectedStatus: Status = Status.All;

  userServices: Service[] | null = [];

  ngOnInit()
  {
    this.loadData();
  }

  buildQueryParams(): string
  {
    const token = localStorage.getItem("token");
    const decodedToken = jwtDecode(token!);

    const params = new URLSearchParams();
    params.append('page', this.currentPage.toString());
    params.append('limit', this.pageSize.toString());
    params.append('status', this.selectedStatus);
    params.append('category', this.selectedCategory);
    params.append('userId', decodedToken.sub!);

    if (this.searchQuery.trim() !== '')
    {
      params.append('search', this.searchQuery.trim());
    }

    return params.toString();
  }

  // ✅ merged final version
  async loadData(): Promise<void>
  {
    try
    {
      const params = this.buildQueryParams();

      await this.http.get<number>(`${environment.apiUrl}/issue/count?${params}`).subscribe(count =>
      {
        this.totalIssues = count;
        this.updatePageNumbers();

        this.http.get<Issue[]>(`${environment.apiUrl}/issue?${params}`).subscribe(res =>
        {
          this.issues = res.map(issue => ({
            ...issue,
            previewDescription: this.stripMarkdown(issue.description)
          }));

          this.cdr.detectChanges();
        });
      });
    }
    catch (err)
    {
      console.log(err);
    }
  }

  stripMarkdown(text: string): string
  {
    if (!text) return '';

    return text
      .replace(/[#_*~`>-]/g, '')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '')
      .replace(/<\/?[^>]+(>|$)/g, '')
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

  getCategoryClass(category: any): string
  {
    if (!category) return '';

    // If value is one of the enum categories
    if (Object.values(Categories).includes(category))
    {
      return CategoryClasses[ category as Categories ];
    }

    // Fallback for custom user category
    const clean = String(category).toLowerCase().replace(/\s+/g, '-');
    return `tag category-generic category-${clean}`;
  }

  getStatusClass(status: any): string
  {
    if (!status) return 'tag status-generic';

    // If value is one of the enum statuses
    if (Object.values(Status).includes(status))
    {
      return StatusClasses[ status as Status ];
    }

    // Fallback for custom/unknown status
    const clean = String(status).toLowerCase().replace(/\s+/g, '-');
    return `tag status-generic status-${clean}`;
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
