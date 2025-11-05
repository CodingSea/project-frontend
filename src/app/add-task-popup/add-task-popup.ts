import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceTasksComponent } from '@app/service.tasks.component/service.tasks.component';

@Component({
  selector: 'add-task-popup',
  imports: [ FormsModule, CommonModule ],
  templateUrl: './add-task-popup.html',
  styleUrls: [ './add-task-popup.css' ]
})
export class AddTaskPopup
{
  @Input() task: any;
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<number>();
  @Output() taskAdded = new EventEmitter<{ text: string; tags: string; description: string; color: string }>();

  title: string = '';
  description: string = '';
  tagsString: string = '';
  tags: string[] = [];
  priority: string = 'Low Priority'; // Default priority
  hasChanges: boolean = false;

  constructor(private taskService: ServiceTasksComponent) { }

  ngOnInit()
  {
    this.title = this.task?.text || '';
    this.description = this.task?.description || '';
    this.tagsString = this.task?.tags || '';
    this.priority = this.task?.priority || 'Low Priority'; // Set priority if available
    this.tags = this.taskService.textToArray(this.task?.tags);

    console.log(this.task);
  }

  onInputChange()
  {
    this.hasChanges = true; // Mark that there are changes
  }

  async closePopup()
  {
    this.close.emit(); // Emit close event
  }

  async saveTask()
  {
    try
    {
      const newTaskOrder = this.taskService.data.filter(task => task.status === 'new').length;

      let selectedColor = "#008000";

      if (this.priority == "Low Priority")
      {
        selectedColor = "#008000";
      }
      else if (this.priority == "Medium Priority")
      {
        selectedColor = "#FFD700";
      }
      else if (this.priority == "High Priority")
      {
        selectedColor = "#C21A25";
      }

      const updatedTask = {
        ...this.task,
        text: this.title,
        order: newTaskOrder,
        description: this.description,
        tags: this.tagsString
      };

      // Emit the task added event with priority
      this.taskAdded.emit({ text: updatedTask.text, tags: updatedTask.tags, description: updatedTask.description, color: selectedColor });

      // Reset form fields
      this.title = '';
      this.description = '';
      this.tagsString = '';
      this.priority = 'Low Priority'; // Reset priority

      this.closePopup();
    } catch (error)
    {
      console.error('Error saving task:', error);
    }
  }

  deleteTask()
  {
    this.delete.emit(this.task.id); // Emit the task ID when deleting
  }

  getPriorityClass(priority: string): string
  {
    switch (priority)
    {
      case 'Low Priority':
        return 'low-priority';
      case 'Medium Priority':
        return 'medium-priority';
      case 'High Priority':
        return 'high-priority';
      default:
        return '';
    }
  }

}