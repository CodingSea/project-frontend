import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IssueService } from '@app/services/issue.service';
import { Sidebar } from '@app/sidebar/sidebar';
import hljs from 'highlight.js';

@Component({
  selector: 'app-issue-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Sidebar],
  templateUrl: './issue-create.html',
  styleUrls: ['./issue-create.css'],
})
export class IssueCreateComponent implements AfterViewInit {
  @ViewChild('codeSnippetEl') codeSnippetEl!: ElementRef<HTMLElement>;

  form!: FormGroup;
  message = '';
  fileError = '';
  codeError = '';
  loading = false;
  attachments: File[] = [];

  readonly MAX_FILES = 5;
  readonly MAX_TOTAL_MB = 30;
  readonly MAX_EACH_MB = 10;
  readonly DISALLOWED_EXT_RE = /\.(exe|dmg|msi|app|apk|pkg|iso|bat|cmd|sh|deb|rpm)$/i;
  readonly MAX_CODE_LINES = 300;
  readonly MAX_CODE_CHARS = 10000;

  constructor(private fb: FormBuilder, private issueService: IssueService, private router: Router) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9 ]{3,100}$/)]],
      description: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(500),
          Validators.pattern(/^[A-Za-z0-9.,!?()\s\-'"@#$/:%&*+=\[\]{}<>]*$/),
        ],
      ],
      category: [''],
      otherCategory: [''],
    });
  }

  ngAfterViewInit() {
    this.applyHighlighting();
  }

  // ========== CODE ==========
  onCodeInput() {
    const content = this.codeSnippetEl.nativeElement.innerText || '';
    const lines = content.split('\n').length;
    const chars = content.length;

    if (lines > this.MAX_CODE_LINES || chars > this.MAX_CODE_CHARS) {
      this.codeError = `Code too long. Max ${this.MAX_CODE_LINES} lines or ${this.MAX_CODE_CHARS} characters.`;
      this.codeSnippetEl.nativeElement.innerText = content.slice(0, this.MAX_CODE_CHARS);
    } else {
      this.codeError = '';
      this.applyHighlighting();
    }
  }

  private applyHighlighting() {
    if (!this.codeSnippetEl) return;
    const code = this.codeSnippetEl.nativeElement.innerText || '';
    const result = hljs.highlightAuto(code);
    this.codeSnippetEl.nativeElement.innerHTML = result.value;
  }

  // ========== FILES ==========
  private totalSizeMB(files: File[]) {
    const bytes = files.reduce((s, f) => s + f.size, 0);
    return bytes / (1024 * 1024);
  }

  private validateAndAddFiles(files: File[]) {
    if (this.attachments.length + files.length > this.MAX_FILES) {
      this.fileError = `You can attach up to ${this.MAX_FILES} files.`;
      return;
    }

    const currentTotal = this.totalSizeMB(this.attachments);
    const addingTotal = this.totalSizeMB(files);
    if (currentTotal + addingTotal > this.MAX_TOTAL_MB) {
      this.fileError = `Total attachments must be ≤ ${this.MAX_TOTAL_MB}MB.`;
      return;
    }

    const rejected: string[] = [];
    const tooLarge: string[] = [];
    const accepted: File[] = [];

    for (const f of files) {
      if (this.DISALLOWED_EXT_RE.test(f.name)) rejected.push(f.name);
      else if (f.size > this.MAX_EACH_MB * 1024 * 1024) tooLarge.push(f.name);
      else accepted.push(f);
    }

    if (rejected.length || tooLarge.length) {
      const msgs = [];
      if (rejected.length) msgs.push(`Blocked types: ${rejected.join(', ')}`);
      if (tooLarge.length) msgs.push(`Too large (> ${this.MAX_EACH_MB}MB): ${tooLarge.join(', ')}`);
      this.fileError = msgs.join(' | ');
    } else {
      this.fileError = '';
      this.attachments.push(...accepted);
    }
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    this.validateAndAddFiles(Array.from(input.files));
    input.value = '';
  }

  onFileDropped(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.files) this.validateAndAddFiles(Array.from(e.dataTransfer.files));
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
  }

  removeFile(i: number) {
    this.attachments.splice(i, 1);
  }

  // ========= COPY CODE =========
  copyCode() {
    const code = this.codeSnippetEl?.nativeElement?.innerText?.trim() || '';
    if (!code) {
      this.message = 'No code to copy.';
      setTimeout(() => (this.message = ''), 2000);
      return;
    }

    navigator.clipboard.writeText(code);
    this.message = 'Code copied.';
    setTimeout(() => (this.message = ''), 2000);
  }

  // ========== SUBMIT ==========
  onSubmit() {
    if (this.form.invalid || this.fileError || this.codeError) {
      this.message = 'Please fix validation errors.';
      return;
    }

    const { title, description, category, otherCategory } = this.form.value;
    const cat = category === 'Other' ? otherCategory || 'Other' : category;

    const data = {
      title,
      description,
      category: cat,
      codeSnippet: this.codeSnippetEl.nativeElement.innerText,
      createdById: 1,
    };

    this.loading = true;
    this.issueService.createIssue(data, this.attachments).subscribe({
      next: () => {
        this.message = 'Issue created successfully.';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/issues']), 1000);
      },
      error: (err) => {
        console.error('Create failed:', err);
        this.message = 'Failed to create issue.';
        this.loading = false;
      },
    });
  }

  onCancel() {
    this.router.navigate(['/issues']);
  }
}
