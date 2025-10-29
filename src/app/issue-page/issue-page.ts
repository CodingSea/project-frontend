import { Component, AfterViewInit } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import Prism from 'prismjs';

@Component({
  selector: 'app-issue-page',
  standalone: true,
  imports: [Sidebar],
  templateUrl: './issue-page.html',
  styleUrls: ['./issue-page.css']
})
export class IssuePage implements AfterViewInit {

  ngAfterViewInit() {
    // highlight all code blocks when component renders
    Prism.highlightAll();
  }

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
