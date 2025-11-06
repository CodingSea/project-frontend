import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import { IssueService, Issue } from '../services/issue.service';
import { marked } from 'marked';
import { ActivatedRoute } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { environment } from '@environments/environment';
import { Categories, CategoryClasses } from '@app/categories';
import { Status, StatusClasses } from '@app/status';

@Component({
  selector: 'app-issue-page-template',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issue-page-template.html',
  styleUrls: ['./issue-page.css'],
})
export class IssuePageTemplate implements AfterViewInit, OnInit {

  issue: Issue | null = null;
  issueId: number | null = null;
  loading = true;
  error = '';
  newFeedback = '';
  selectedFiles: File[] = [];
  replyContent: { [key: number]: string } = {};
  showReplyBox: { [key: number]: boolean } = {};
  isImageLoading: { [key: string]: boolean } = {};
  currentUserId: number | null = null;
  showBackBtn: boolean = true;
  cachedProfileImage: string | null = localStorage.getItem('profileImage') ?? null;

  constructor(
    private issueService: IssueService,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {
    marked.setOptions({ gfm: true, breaks: true } as any);
  }

  ngOnInit() {
    window.addEventListener('profile-image-changed', this.handleProfileImageChange);

    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.currentUserId = Number(decoded.sub);
    }
    this.getIssueId();
  }

  ngOnDestroy() {
    window.removeEventListener('profile-image-changed', this.handleProfileImageChange);
  }

  // ✅ Category Badge Styling
  getCategoryClass(category: any): string {
    if (!category) return '';
    if (Object.values(Categories).includes(category)) {
      return CategoryClasses[category as Categories];
    }
    const clean = String(category).toLowerCase().replace(/\s+/g, '-');
    return `tag category-generic category-${clean}`;
  }

  // ✅ Status Badge Styling
  getStatusClass(status: any): string {
    if (!status) return 'tag status-generic';
    if (Object.values(Status).includes(status)) {
      return StatusClasses[status as Status];
    }
    const clean = String(status).toLowerCase().replace(/\s+/g, '-');
    return `tag status-generic status-${clean}`;
  }

  private handleProfileImageChange = (event: any) => {
    this.cachedProfileImage = event.detail ?? null;
    if (this.issue && this.issue.feedbacks) {
      this.issue.feedbacks.forEach(fb => {
        if (fb.user?.id === this.currentUserId) {
          fb.user.profileImage = this.cachedProfileImage ?? '';
        }
        fb.comments?.forEach(c => {
          if (c.user?.id === this.currentUserId) {
            c.user.profileImage = this.cachedProfileImage ?? '';
          }
        });
      });
    }
  };

  async getIssueId() {
    let id = -1;
    if (this.route.snapshot.paramMap.has('id')) {
      id = Number(this.route.snapshot.paramMap.get('id'));
      this.issueId = id;
      this.loadIssue(id);
      this.showBackBtn = true;
    } else if (this.route.snapshot.paramMap.has('serviceId')) {
      this.http.get<Issue>(`${environment.apiUrl}/service/${this.route.snapshot.paramMap.get('serviceId')}/issue`)
        .subscribe(res => {
          id = res.id!;
          this.issueId = id;
          this.loadIssue(id);
          this.showBackBtn = false;
        });
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      Prism.highlightAll();
      this.addCopyButtons();
    }, 300);
  }

  fixImage(path: string | null | undefined, userId?: number): string {
    if (userId && userId === this.currentUserId && this.cachedProfileImage) {
      return this.cachedProfileImage;
    }
    const creatorCache = localStorage.getItem('creatorImage_' + userId);
    if (creatorCache) return creatorCache;
    if (!path) return 'images/user.png';
    if (path.startsWith('http')) return path;
    const url = `${environment.apiUrl.replace('/api', '')}/${path}`.replace(/\/+/g, '/');
    if (userId) localStorage.setItem('creatorImage_' + userId, url);
    return url;
  }

  renderMarkdown(text: string): string {
    return marked.parse(text ?? '') as string;
  }

  getTimeAgo(date: any): string {
    const d: Date = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
    const units = [
      { s: 31536000, n: "year" },
      { s: 2592000, n: "month" },
      { s: 86400, n: "day" },
      { s: 3600, n: "hour" },
      { s: 60, n: "minute" }
    ];
    for (const u of units) {
      const interval = Math.floor(seconds / u.s);
      if (interval >= 1) return `${interval} ${u.n}${interval > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  }

  loadIssue(id: number) {
    this.loading = true;
    this.issueService.getIssueById(id).subscribe({
      next: (data) => {

        if (data.createdBy?.id) {
          this.isImageLoading[data.createdBy.id] = true;
        }

        const img = new Image();
        if (data.createdBy?.profileImage) {
          img.src = this.fixImage(data.createdBy.profileImage, data.createdBy.id);
        }

        this.issue = {
          ...data,
          createdBy: data.createdBy
            ? {
              ...data.createdBy,
              profileImage: this.fixImage(data.createdBy.profileImage, data.createdBy.id)
            }
            : undefined,
          descriptionHtml: this.renderMarkdown(data.description || '')
        };

        const fbList = data.feedbacks ?? [];
        this.issue.feedbacks = fbList.map((fb: any) => {
          let cleanContent = fb.content;
          try { cleanContent = JSON.parse(fb.content).content; } catch { }

          return {
            ...fb,
            content: cleanContent,
            user: fb.user ? {
              ...fb.user,
              profileImage: this.fixImage(fb.user.profileImage, fb.user?.id)
            } : undefined,
            comments: (fb.comments ?? []).map((c: any) => {
              let txt = c.content;
              try { txt = JSON.parse(c.content).content; } catch { }
              return {
                ...c,
                content: txt,
                user: c.user ? {
                  ...c.user,
                  profileImage: this.fixImage(c.user.profileImage, c.user?.id)
                } : { first_name: 'Unknown', last_name: '', profileImage: '' }
              };
            })
          };
        });

        if (this.issue.feedbacks?.length) {
          this.issue.feedbacks = [...this.issue.feedbacks].sort((a: any, b: any) => {
            if (a.isAccepted && !b.isAccepted) return -1;
            if (!a.isAccepted && b.isAccepted) return 1;
            return new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime();
          });
        }

        this.loading = false;
        setTimeout(() => {
          Prism.highlightAll();
          this.addCopyButtons();
        }, 200);
      },
      error: () => {
        this.error = 'Issue not found';
        this.loading = false;
      }
    });
  }

  onImgLoad(id: string | number) { this.isImageLoading[String(id)] = false; }
  onImgError(event: any, id: string | number) {
    this.isImageLoading[String(id)] = false;
    event.target.src = 'images/user.png';
  }

addCopyButtons() {
  const blocks = document.querySelectorAll("pre:not(.copy-added)") as NodeListOf<HTMLElement>;

  blocks.forEach(pre => {
    pre.classList.add("copy-added");
    pre.style.position = "relative";

    // Avoid duplicate buttons
    if (pre.querySelector(".code-copy-btn")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("code-copy-btn");
    button.innerHTML = '<i class="fa-regular fa-copy"></i>';

    button.addEventListener("click", () => {
      const code = pre.querySelector("code")?.textContent ?? "";
      navigator.clipboard.writeText(code);
      button.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => {
        button.innerHTML = '<i class="fa-regular fa-copy"></i>';
      }, 800);
    });

    pre.appendChild(button);
  });
}


  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.selectedFiles.push(...Array.from(input.files));
    input.value = '';
  }

  submitFeedback() {
    if (!this.issueId || !this.newFeedback.trim() || !this.currentUserId) return;
    const fd = new FormData();
    fd.append('content', this.newFeedback);
    fd.append('userId', String(this.currentUserId));
    this.selectedFiles.forEach(file => fd.append('attachments', file));
    this.issueService.addFeedback(this.issueId, fd).subscribe(() => {
      this.newFeedback = '';
      this.selectedFiles = [];
      this.loadIssue(this.issueId!);
    });
  }

  submitComment(feedbackId: number) {
    const text = this.replyContent[feedbackId]?.trim();
    if (!text || !this.currentUserId) return;
    this.issueService.addComment(feedbackId, text).subscribe((nc: any) => {
      const fb = this.issue?.feedbacks?.find(f => f.id === feedbackId);
      if (fb) {
        const loggedInUser = this.issue?.feedbacks
          ?.map(f => f.user)
          ?.find(u => u?.id === this.currentUserId);

        const userImage = loggedInUser?.profileImage
          ? this.fixImage(loggedInUser.profileImage)
          : 'images/user.png';

        fb.comments = fb.comments || [];
        fb.comments.push({
          ...nc,
          content: nc.content,
          user: { ...nc.user, profileImage: userImage }
        });
      }

      this.replyContent[feedbackId] = '';
      this.showReplyBox[feedbackId] = false;
    });
  }

  toggleReplyBox(id: number) { this.showReplyBox[id] = !this.showReplyBox[id]; }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    const max = 240;
    textarea.style.height = (textarea.scrollHeight < max ? textarea.scrollHeight : max) + 'px';
  }

  removeFile(i: number) { this.selectedFiles.splice(i, 1); }

  acceptFeedback(feedbackId: number) {
    if (!this.issue || !this.currentUserId) return;
    if (this.issue.createdBy?.id !== this.currentUserId) return;

    this.issueService.toggleFeedbackAccepted(feedbackId, this.currentUserId).subscribe(() => {
      if (!this.issue || !this.issue.feedbacks) return;

      const feedbacks = this.issue.feedbacks;
      const fb = feedbacks.find(f => f.id === feedbackId);
      if (!fb) return;

      fb.isAccepted = !fb.isAccepted;

      const hasAccepted = feedbacks.some(f => f.isAccepted);
      this.issue.status = hasAccepted ? 'resolved' : 'open';

      this.issueService.updateIssueStatus(this.issueId!, this.issue.status).subscribe();

      this.issue.feedbacks = [...(feedbacks ?? [])].sort((a: any, b: any) => {
        if (a.isAccepted && !b.isAccepted) return -1;
        if (!a.isAccepted && b.isAccepted) return 1;
        return new Date(a.createdAt ?? '').getTime() - new Date(b.createdAt ?? '').getTime();
      });
    });
  }

  goBack() {
    window.history.length > 2 ? history.back() : (window.location.href = '/home');
  }

  download(file: any) {
    let key = file.key || file.url;
    if (key.startsWith("http"))
      key = key.split(".amazonaws.com/")[1].split("?")[0];

    this.issueService.downloadFile(key).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  getFeedbackContent(fb: any) {
    try {
      const parsed = JSON.parse(fb.content);
      return parsed.content ?? fb.content;
    } catch {
      return fb.content;
    }
  }

  normalizeStatus(status: string | undefined | null): string {
    if (!status) return 'open';
    return status
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/_/g, '-');
  }
}
