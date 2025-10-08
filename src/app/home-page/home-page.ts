import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Sidebar } from "@app/sidebar/sidebar";
import { HeaderComponent } from '@app/header/header';

@Component({
  selector: 'app-home-page',
  imports: [Sidebar],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePage {

}
