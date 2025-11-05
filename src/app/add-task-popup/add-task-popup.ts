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
  @Input() users: any[] = []; // ✅ List of assignable users
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<number>();
  @Output() taskAdded = new EventEmitter<{
    text: string;
    tags: string;
    description: string;
    color: string;
    assigneeId?: number;
  }>();

  title: string = '';
  description: string = '';
  tagsString: string = '';
  tags: string[] = [];
  priority: string = 'Low Priority';
  hasChanges: boolean = false;
  assigneeId: number | null = null; // ✅ Selected user ID

  constructor(private taskService: ServiceTasksComponent) { }

  ngOnInit()
  {
    this.title = this.task?.text || '';
    this.description = this.task?.description || '';
    this.tagsString = this.task?.tags || '';
    this.priority = this.task?.priority || 'Low Priority';
    this.assigneeId = this.task?.assigneeId || null; // ✅ Set from existing task if any
    this.tags = this.taskService.textToArray(this.task?.tags);
  }

  onInputChange()
  {
    this.hasChanges = true;
  }

  async closePopup()
  {
    this.close.emit();
  }

  async saveTask()
  {
    try
    {
      const newTaskOrder = this.taskService.data.filter(task => task.status === 'new').length;

      let selectedColor = '#008000';
      if (this.priority === 'Medium Priority') selectedColor = '#FFD700';
      else if (this.priority === 'High Priority') selectedColor = '#C21A25';

      const updatedTask = {
        ...this.task,
        text: this.title,
        order: newTaskOrder,
        description: this.description,
        tags: this.tagsString,
        assigneeId: this.assigneeId // ✅ Include assignee
      };

      this.taskAdded.emit({
        text: updatedTask.text,
        tags: updatedTask.tags,
        description: updatedTask.description,
        color: selectedColor,
        assigneeId: updatedTask.assigneeId
      });

      // Reset form
      this.title = '';
      this.description = '';
      this.tagsString = '';
      this.priority = 'Low Priority';
      this.assigneeId = null;

      this.closePopup();
    } catch (error)
    {
      console.error('Error saving task:', error);
    }
  }

  deleteTask()
  {
    this.delete.emit(this.task.id);
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
