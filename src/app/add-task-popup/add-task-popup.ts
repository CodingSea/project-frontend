import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceTasksComponent } from '@app/service.tasks.component/service.tasks.component';

@Component({
  selector: 'add-task-popup',
  imports: [ FormsModule ],
  templateUrl: './add-task-popup.html',
  styleUrl: './add-task-popup.css'
})
export class AddTaskPopup
{
  @Input() task: any;
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<number>();

  @Output() taskAdded = new EventEmitter<{ text: string; tags: string; description: string; }>();

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
    this.close.emit(); // Emit close event
  }

  async saveTask()
  {
    try
    {
      const newTaskOrder = this.taskService.data.filter(task => task.status === 'new').length;

      const updatedTask = {
        ...this.task,
        text: this.title,
        order: newTaskOrder,
        description: this.description,
        tags: this.tagsString,
      };

      // console.log("popup", updatedTask)

      // await this.taskService.createTask(updatedTask.text, "new", updatedTask.tags, updatedTask.description); // Call the updateTask method

      this.taskAdded.emit({ text: updatedTask.text, tags: updatedTask.tags, description: updatedTask.description });
      this.title = '';
      this.description = '';
      this.tagsString = '';

      this.closePopup();
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
