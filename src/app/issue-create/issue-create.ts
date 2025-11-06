import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IssueService } from '@app/services/issue.service';
import { Sidebar } from '@app/sidebar/sidebar';
import { Categories } from '../categories';
import { jwtDecode } from 'jwt-decode';
import { ExternalSitePopupComponent } from '@app/external-site-popup-component/external-site-popup-component';
import { HeaderComponent } from '@app/header/header';

@Component({
  selector: 'app-issue-create',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, Sidebar, ExternalSitePopupComponent, HeaderComponent ],
  templateUrl: './issue-create.html',
  styleUrls: [ './issue-create.css' ],
})
export class IssueCreateComponent implements OnInit
{
  @ViewChild(ExternalSitePopupComponent) popup!: ExternalSitePopupComponent;

  form: any;

  attachments: File[] = [];
  fileError = '';
  loading = false;
  message = '';
  categories = Object.values(Categories);

  currentUserId: number | null = null;

  readonly MAX_FILES = 5;
  readonly MAX_TOTAL_MB = 30;

  ngOnInit(): void
  {
    this.categories.shift();
  }

  constructor(
    private fb: FormBuilder,
    private issueService: IssueService,
    private router: Router
  )
  {
    this.form = this.fb.group({
title: [
  '',
  [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(100),
    Validators.pattern(/^[A-Za-z\u0600-\u06FF0-9 _\-():.,#]+$/)
  ]
],

      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(5000)
        ]
      ],
      category: [ '' ],
      otherCategory: [ '' ]
    });

    // ✅ Get current user ID from JWT
    const token = localStorage.getItem('token');
    if (token)
    {
      const decoded: any = jwtDecode(token);
      this.currentUserId = Number(decoded.sub);
    }
  }

  private totalSize(files: File[])
  {
    return files.reduce((s, f) => s + f.size, 0) / (1024 * 1024);
  }

  private validateAndAdd(files: File[]): boolean
  {
    if (this.attachments.length + files.length > this.MAX_FILES)
    {
      this.fileError = `Maximum ${this.MAX_FILES} files allowed`;
      return false;
    }
    if (this.totalSize([ ...this.attachments, ...files ]) > this.MAX_TOTAL_MB)
    {
      this.fileError = `Maximum ${this.MAX_TOTAL_MB}MB total size`;
      return false;
    }
    this.fileError = '';
    this.attachments.push(...files);
    return true;
  }

  onFileSelected(e: Event)
  {
    const input = e.target as HTMLInputElement;
    if (input.files) this.validateAndAdd(Array.from(input.files));
    input.value = '';
  }

  onDragOver(e: DragEvent)
  {
    e.preventDefault();
  }

  onFileDropped(e: DragEvent)
  {
    e.preventDefault();
    if (e.dataTransfer?.files) this.validateAndAdd(Array.from(e.dataTransfer.files));
  }

  removeFile(i: number)
  {
    this.attachments.splice(i, 1);
  }

  onCancel()
  {
    this.router.navigate([ '/home' ]);
  }

  onSubmit()
  {
    if (this.form.invalid || this.fileError)
    {
      this.message = '⚠️ Please fix form errors';
      return;
    }

    if (!this.currentUserId)
    {
      alert('User not logged in');
      return;
    }

    const { title, description, category, otherCategory } = this.form.value;
    const finalCategory = category === 'Other' ? otherCategory : category;

    const payload = {
      title,
      description,
      category: finalCategory,
      createdById: this.currentUserId
    };

    this.loading = true;
    this.issueService.createIssue(payload, this.attachments).subscribe({
      next: () =>
      {
        this.message = '✅ Issue created successfully';
        this.loading = false;
        setTimeout(() => this.router.navigate([ '/issues' ]), 800);
      },
      error: () =>
      {
        this.message = '❌ Error creating issue';
        this.loading = false;
      }
    });
  }

  // ✅ From HEAD
  openExternalSite()
  {
    this.popup.open();
  }

  // ✅ From issue-enhancements
  autoResize(event: Event)
  {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    const maxHeight = 300;

    if (textarea.scrollHeight < maxHeight)
    {
      textarea.style.height = textarea.scrollHeight + 'px';
    } else
    {
      textarea.style.height = maxHeight + 'px';
    }
  }

  // ✅ From issue-enhancements
  openMarkdownCheat()
  {
    window.open("https://www.markdownguide.org/cheat-sheet/", "_blank");
  }
}
