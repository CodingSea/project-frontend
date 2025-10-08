import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'task-popup',
  imports: [],
  templateUrl: './task-popup.html',
  styleUrl: './task-popup.css'
})
export class TaskPopup
{
  @Input() task: any;
  @Output() close = new EventEmitter<void>();

  closePopup()
  {
    this.close.emit();
  }
}
