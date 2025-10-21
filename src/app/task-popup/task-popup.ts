import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ServiceTasksComponent } from '@app/service.tasks.component/service.tasks.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  imports: [ FormsModule, CommonModule ],
  selector: 'task-popup',
  templateUrl: './task-popup.html',
  styleUrls: [ './task-popup.css' ]
})
export class TaskPopup
{
  @Input() task: any;
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<number>();

  title: string = '';
  description: string = '';
  tagsString: string = '';
  tags: string[] = [];
  hasChanges: boolean = false;
  priority: string = 'Low Priority';

  constructor(private taskService: ServiceTasksComponent) { }

  ngOnInit()
  {
    this.title = this.task?.text || '';
    this.description = this.task?.description || '';
    this.tagsString = this.task?.tags || '';

    if(this.tags = [" "])
    {
      this.tags = [];
    }
    
    this.priority = this.task?.priority || 'Low Priority';

    if (this.task.color == "#008000")
    {
      this.priority = 'Low Priority';
    }
    else if (this.task.color == "#FFD700")
    {
      this.priority = 'Medium Priority';
    }
    else if (this.task.color == "#C21A25")
    {
      this.priority = 'High Priority';
    }

    this.tags = this.taskService.textToArray(this.task?.tags);

    console.log(this.task);
  }

  onInputChange()
  {
    this.hasChanges = true; // Mark that there are changes
  }

  async closeAndSavePopup()
  {
    if (this.hasChanges)
    {
      // Update the task with the new description
      await this.saveTask();
    }
    this.close.emit(); // Emit close event
  }

  async closePopup()
  {
    this.close.emit(); // Emit close event
  }

  async saveTask()
  {
    try
    {

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
        order: this.task.order || 0,
        description: this.description,
        tags: this.tagsString,
        color: selectedColor
      };

      // console.log("popup", updatedTask)

      await this.taskService.updateTask(updatedTask); // Call the updateTask method

      this.taskService.initializeKanbanDataSource();
    } catch (error)
    {
      console.error('Error saving description:', error);
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