import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';

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
  textContent: string = '';

  constructor(private http: HttpClient) { }

  open()
  {
    this.showModal = true;
    this.loadText();
  }

  close()
  {
    this.showModal = false;
  }

  private loadText()
  {
    this.http.get('assets/github-markdown.txt', { responseType: 'text' }).subscribe(
      (text) =>
      {
        this.textContent = text;
      },
      (error) =>
      {
        console.error('Error fetching text file:', error);
      }
    );
  }

}