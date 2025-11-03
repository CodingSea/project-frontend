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

@Component({
  selector: 'app-issue-page',
  standalone: true,
  imports: [CommonModule, Sidebar, HttpClientModule, FormsModule],
  templateUrl: './issue-page.html',
  styleUrls: ['./issue-page.css'],
})
export class IssuePage implements AfterViewInit, OnInit {

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

  constructor(private issueService: IssueService, private route: ActivatedRoute) {
    marked.setOptions({ gfm: true, breaks: true } as any);
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      this.currentUserId = Number(decoded.sub);
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.issueId = id;
    this.loadIssue(id);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      Prism.highlightAll();
      this.addCopyButtons();
    }, 300);
  }

  fixImage(path: string | null | undefined): string {
    if (!path) return 'images/user.png';
    if (path.startsWith('http')) return path;
    return `${environment.apiUrl.replace('/api','')}/${path}`.replace(/\/+/g, '/');
  }

  renderMarkdown(text: string): string {
    return marked.parse(text ?? '') as string;
  }

  loadIssue(id: number) {
    this.loading = true;

    this.issueService.getIssueById(id).subscribe({
      next: (data) => {
        this.issue = {
          ...data,
          createdBy: data.createdBy
            ? { ...data.createdBy, profileImage: data.createdBy.profileImage || '' }
            : undefined,
          descriptionHtml: this.renderMarkdown(data.description || '')
        };

        if (this.issue.feedbacks) {
          this.issue.feedbacks = this.issue.feedbacks.map(fb => ({
            ...fb,
            user: fb.user
              ? { ...fb.user, profileImage: fb.user.profileImage || '' }
              : undefined,
            comments: (fb.comments ?? []).map(c => ({
              ...c,
              user: c.user
                ? { ...c.user, profileImage: c.user.profileImage || '' }
                : { first_name: 'Unknown', last_name: '', profileImage: '' }
            }))
          })) as any;
        }

        this.loading = false;
        setTimeout(() => {
          Prism.highlightAll();
          this.addCopyButtons();
        }, 300);
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
      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      const parent = pre.parentNode!;
      parent.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const button = document.createElement("button");
      button.textContent = "Copy";
      button.style.position = "absolute";
      button.style.top = "6px";
      button.style.right = "6px";

      button.addEventListener("click", () => {
        const code = pre.querySelector("code")?.textContent ?? "";
        navigator.clipboard.writeText(code);
        button.textContent = "Copied!";
        setTimeout(() => (button.textContent = "Copy"), 800);
      });

      wrapper.appendChild(button);
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    this.selectedFiles.push(...files);
    input.value = '';
  }

  submitFeedback() {
    if (!this.issueId || !this.newFeedback.trim() || !this.currentUserId) return;

    const formData = new FormData();
    formData.append('content', this.newFeedback);
    formData.append('userId', this.currentUserId.toString());
    this.selectedFiles.forEach(file => formData.append('attachments', file));

    this.issueService.addFeedback(this.issueId, formData).subscribe(() => {
      this.newFeedback = '';
      this.selectedFiles = [];
      this.loadIssue(this.issueId!);
    });
  }

  submitComment(feedbackId: number) {
    const text = this.replyContent[feedbackId]?.trim();
    if (!text || !this.currentUserId) return;

    this.issueService.addComment(feedbackId, text).subscribe((newComment: any) => {
      const fb = this.issue?.feedbacks?.find(f => f.id === feedbackId);
      if (fb) {
        fb.comments = fb.comments || [];
        fb.comments.push({
          ...newComment,
          user: {
            ...newComment.user,
            profileImage: newComment.user.profileImage || ''
          }
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
    textarea.style.height = textarea.scrollHeight + 'px';
  }
  removeFile(i: number) { this.selectedFiles.splice(i, 1); }

  acceptFeedback(feedbackId: number) {
    if (!this.issue || !this.currentUserId) return;
    if (this.issue.createdBy?.id !== this.currentUserId) return;

    this.issueService.toggleFeedbackAccepted(feedbackId, this.currentUserId).subscribe(() => {
      const fb = this.issue?.feedbacks?.find(f => f.id === feedbackId);
      if (fb) fb.isAccepted = !fb.isAccepted;
    });
  }

  goBack() { window.history.length > 2 ? history.back() : (window.location.href = '/home'); }

  download(file: any) {
    let key = file.key || file.url;
    if (key.startsWith("http")) key = key.split(".amazonaws.com/")[1].split("?")[0];

    this.issueService.downloadFile(key).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
