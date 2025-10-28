import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import { Categories } from '@app/categories';

@Component({
  selector: 'app-home-page',
  imports: [Sidebar],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage 
{
  categories: string[] = Object.values(Categories);
}
