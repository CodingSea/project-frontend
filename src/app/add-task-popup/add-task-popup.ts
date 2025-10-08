import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'add-task-popup',
  imports: [ FormsModule ],
  templateUrl: './add-task-popup.html',
  styleUrl: './add-task-popup.css'
})
export class AddTaskPopup
{
  taskText: string = '';
  tagsText: string = '';

  @Output() taskAdded = new EventEmitter<{ text: string; tags: string; }>();
  @Output() close = new EventEmitter<void>();

  addTask()
  {
    if (this.taskText)
    {
      this.taskAdded.emit({ text: this.taskText, tags: this.tagsText });
      this.taskText = '';
      this.tagsText = '';
    }
  }

  closePopup()
  {
    this.close.emit();
    this.taskText = '';
    this.tagsText = '';
  }
}
