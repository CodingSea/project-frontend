import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-external-site-popup-component',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './external-site-popup-component.html',
  styleUrls: [ './external-site-popup-component.css' ]
})
export class ExternalSitePopupComponent
{
  showModal = false;
  textContent: string | Promise<string> = '';
  markdownContent: SafeHtml = '';

  constructor(private http: HttpClient, private sanitizer: DomSanitizer)
  {
    marked.setOptions({ gfm: true, breaks: true });
  }

  open()
  {
    this.showModal = true;
    this.loadFileContent();
  }

  close()
  {
    this.showModal = false;
  }

  loadFileContent()
  {
    this.fetchFileContent()
      .then(content =>
      {
        this.textContent = content; // Store raw content if needed
        this.markdownContent = this.renderMarkdown(content); // Render Markdown
      })
      .catch(error =>
      {
        console.error('Error fetching file:', error);
      });
  }

  stripMarkdown(text: string): string
  {
    if (!text) return '';

    return text
      .replace(/[#_*~`>-]/g, '')          // Remove Markdown symbols
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // Remove Markdown links but keep text
      .replace(/!\[(.*?)\]\((.*?)\)/g, '')  // Remove images completely
      .replace(/<\/?[^>]+(>|$)/g, '')       // Remove HTML tags
      .trim();
  }

  renderMarkdown(text: string): SafeHtml
  {
    const html: any = marked(text ?? ''); // Convert Markdown to HTML
    return this.sanitizer.bypassSecurityTrustHtml(html); // Sanitize the HTML
  }

  fetchFileContent(): Promise<string>
  {
    return fetch("github-markdown.txt") // Ensure this path is correct
      .then(response =>
      {
        if (!response.ok)
        {
          throw new Error('Network response was not ok');
        }
        return response.text();
      });
  }
}