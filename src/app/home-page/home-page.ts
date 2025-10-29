import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import { Categories } from '@app/categories';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '@environments/environment';
import { CommonModule } from '@angular/common';
import { Issue } from '@app/issue';

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

  issues: Issue[] = [];

  ngOnInit()
  {
    this.http.get<Issue[]>(`${environment.apiUrl}/issue`).subscribe(
      (res) =>
      {
        this.issues = res;
        this.cdr.markForCheck();
      },
      (err) =>
      {
        console.log(err);
      }
    )
  }


  getTimeAgo(createdAt: Date): string
  {
    const now = new Date();
    const differenceInMs = now.getTime() - createdAt.getTime();

    const seconds = Math.floor(differenceInMs / 1000);
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(seconds / 86400);

    if (differenceInMs < 24 * 60 * 60 * 1000)
    { // Less than 24 hours
      return hours + ' hour' + (hours === 1 ? '' : 's') + ' ago';
    } else if (differenceInMs < 7 * 24 * 60 * 60 * 1000)
    { // Less than a week
      return days + ' day' + (days === 1 ? '' : 's') + ' ago';
    } else
    { // More than a week
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return createdAt.toLocaleDateString(undefined, options); // Format the date
    }
  }

}
