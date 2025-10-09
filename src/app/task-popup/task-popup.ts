import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'task-popup',
  templateUrl: './task-popup.html',
  styleUrls: [ './task-popup.css' ]
})
export class TaskPopup
{
  @Input() task: any;
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<number>();

  closePopup()
  {
    this.close.emit();
  }

  deleteTask()
  {
    this.delete.emit(this.task.id); // Emit the task ID when deleting
  }
}