import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { jqxKanbanComponent, jqxKanbanModule } from "jqwidgets-ng/jqxkanban";
import { jqxSplitterModule } from 'jqwidgets-ng/jqxsplitter';
import { AddTaskPopup } from '@app/add-task-popup/add-task-popup';
import { TaskPopup } from '@app/task-popup/task-popup';
import { HttpClient } from '@angular/common/http';
import { TaskCard } from '@app/task-card';
import { environment } from '@environments/environment';
import { TaskBoard } from '@app/task-board';
import { Sidebar } from "@app/sidebar/sidebar";
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-service-tasks',
  templateUrl: './service.tasks.component.html',
  styleUrls: [ './service.tasks.component.css' ],
  imports: [ jqxKanbanModule, jqxSplitterModule, CommonModule, AddTaskPopup, TaskPopup, Sidebar ]
})

export class ServiceTasksComponent implements AfterViewInit 
{
  @ViewChild('kanbanReference') kanban!: jqxKanbanComponent;

  showKanban = true;

  data: any[] = [];
  dataAdapter: any;
  showPopup: boolean = false;
  showTaskDetailPopup = false;
  selectedTask: any;
  dragInProgress = false;
  dragCooldown = false;

  columns: any[] = [
    { text: 'Backlog', dataField: 'new', minWidth: 150 },
    { text: 'In Progress', dataField: 'work', minWidth: 150 },
    { text: 'Done', dataField: 'done', minWidth: 150 }
  ];

  constructor(private cdr: ChangeDetectorRef, private http: HttpClient) { }

  async getBoardCards(): Promise<void>
  {
    try
    {
      const response = await this.http.get<TaskCard[]>(`${environment.apiUrl}/service/${2}/tasks`).toPromise();

      if (response == null) return;

      this.data = []; // Reset data

      for (let i = 0; i < response.length; i++)
      {
        this.data.push({
          id: response[ i ].id, // Ensure this is set correctly
          status: response[ i ].column,
          text: response[ i ].title,
          tags: response[ i ].tags
        });
      }
    } catch (error)
    {
      console.log('Error fetching board cards:', error);
    }
  }

  ngAfterViewInit()
  {
    this.initializeKanbanDataSource();
  }

  openTaskDetailPopup(item: any)
  {
    if (this.dragInProgress || this.dragCooldown)
    {
      return;
    }

    this.selectedTask = item;
    this.showTaskDetailPopup = true;
  }

  async onItemMoved(event: any): Promise<void>
  {
    console.log('Event:', event); // Log the entire event object
    this.dragInProgress = true;
    this.dragCooldown = true;

    // Access the moved task from event.args.itemData
    const movedTask = event.args.itemData;
    console.log('Moved Task:', movedTask); // Log the moved task

    if (!movedTask)
    {
      console.error('Moved task is undefined');
      this.dragInProgress = false;
      this.dragCooldown = false;
      return;
    }

    const newStatus = event.args.newColumn.dataField; // Get the new status (column)

    // Update the task in the local data array
    const taskToUpdate = this.data.find(task => task.id === movedTask.id);
    if (taskToUpdate)
    {
      taskToUpdate.status = newStatus; // Update the status

      // Save or update the task in the backend
      await this.updateTask(taskToUpdate); // Call updateTask
    } else
    {
      console.error('Task to update not found:', movedTask);
    }

    // Reset drag states
    setTimeout(() =>
    {
      this.dragInProgress = false;
    }, 0);

    setTimeout(() =>
    {
      this.dragCooldown = false;
    }, 300);
  }

  private async saveOrUpdateTask(task: any): Promise<void>
  {
    try
    {
      const url = `${environment.apiUrl}/service/${2}/tasks/${task.id}`;
      // Assuming you have a PUT or POST endpoint based on whether the task exists
      const response = await this.http.put(url, task).toPromise(); // Use PUT for updates
      console.log('Task saved/updated successfully:', response);
    } catch (error)
    {
      console.error('Error saving/updating task:', error);
    }
  }

  closeTaskDetailPopup()
  {
    this.showTaskDetailPopup = false;
    this.selectedTask = null;
  }

  openPopup()
  {
    this.showPopup = true;
  }

  closePopup()
  {
    this.showPopup = false;
  }

  private textToArray(text: string): string[]
  {
    if (!text) return [];
    return text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  onTaskAdded(task: { text: string; tags: string }): void
  {
    this.createTask(task.text, 'new', task.tags); // Include empty description
  }

  async initializeKanbanDataSource(): Promise<void>
  {
    await this.getBoardCards();

    this.dataAdapter = new jqx.dataAdapter({
      localData: this.data,
      dataType: 'array',
      dataFields: [
        { name: 'id', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'text', type: 'string' },
        { name: 'tags', type: 'string' }
      ]
    });

    this.dataAdapter.localdata = this.data;
    this.rebuildKanban();
  }

  addTask(column: string, taskText: string, tagsText: string)
  {
    const newTask = {
      id: (this.data.length + 1).toString(),
      status: column,
      text: taskText,
      tags: this.textToArray(tagsText)
    };

    this.data.push(newTask);

    this.dataAdapter.localdata = this.data;
    this.rebuildKanban();

    this.closePopup();
  }

  rebuildKanban()
  {
    if (this.kanban)
    {
      this.kanban.destroy();
    }

    this.showKanban = false;

    setTimeout(() =>
    {
      this.dataAdapter = new jqx.dataAdapter(this.dataAdapter);
      this.showKanban = true;
    }, 0);
  }


  async createTask(taskText: string, column: string, tagsText: string): Promise<void>
  {
    const newTask = {
      title: taskText,
      column: column,
      description: '', // Add any description if needed
      tags: this.textToArray(tagsText)
    };

    try
    {
      const response = await this.http.post<TaskCard>(`${environment.apiUrl}/service/${1}/cards`, newTask).toPromise();
      this.data.push(response);
      this.dataAdapter.localdata = this.data;
      this.rebuildKanban();
      this.closePopup();
    } catch (error)
    {
      console.error('Error creating task:', error);
    }
  }

  async updateTask(task: any): Promise<void>
  {
    if (!task || !task.id)
    {
      console.error('Invalid task object:', task);
      return;
    }

    try
    {
      const response = await this.http.patch(`${environment.apiUrl}/service/${2}/tasks/${task.id}`, {
        column: task.status,
        title: task.text,
        tags: task.tags,
      }).toPromise();
      console.log('Task updated successfully:', response);
    } catch (error)
    {
      console.error('Error updating task:', error);
    }
  }

}
