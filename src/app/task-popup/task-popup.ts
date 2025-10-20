import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ServiceTasksComponent } from '@app/service.tasks.component/service.tasks.component';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [ FormsModule ],
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

  constructor(private taskService: ServiceTasksComponent) { }

  ngOnInit()
  {
    this.title = this.task?.text || '';
    this.description = this.task?.description || '';
    this.tagsString = this.task?.tags || '';

    this.tags = this.taskService.textToArray(this.task?.tags);

    console.log(this.task);
  }

  onInputChange()
  {
    this.hasChanges = true; // Mark that there are changes
  }

  async closePopup()
  {
    if (this.hasChanges)
    {
      // Update the task with the new description
      await this.saveTask();
    }
    this.close.emit(); // Emit close event
  }

  async saveTask()
  {
    try
    {
      const updatedTask = {
        ...this.task,
        text: this.title,
        order: this.task.order || 0,
        description: this.description,
        tags: this.tagsString,
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
}