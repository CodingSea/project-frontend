import { Component } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

}
