import { CommonModule, Location } from '@angular/common';
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
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceInfo } from '@app/service-info';
import { Service, ServiceStatus } from '@app/service';
import { FormsModule } from '@angular/forms';
import { IssuePageTemplate } from '@app/issue-page/issue-page-template';
import { HeaderComponent } from '@app/header/header';

@Component({
  selector: 'app-service-tasks',
  templateUrl: './service.tasks.component.html',
  styleUrls: [ './service.tasks.component.css' ],
  imports: [ jqxKanbanModule, jqxSplitterModule, CommonModule, AddTaskPopup, TaskPopup, Sidebar, FormsModule, IssuePageTemplate, HeaderComponent ]
})

export class ServiceTasksComponent implements OnInit, AfterViewInit
{
  @ViewChild('kanbanReference') kanban!: jqxKanbanComponent;

  showKanban = true;

  editMode: boolean = false;

  data: any[] = [];
  dataAdapter: any;
  showPopup: boolean = false;
  showTaskDetailPopup = false;
  selectedTask: any;
  dragInProgress = false;
  dragCooldown = false;

  serviceId!: number;
  taskBoardId!: number;
  taskBoard: TaskBoard | null = null;

  isTaskboardSelected: boolean = true;

  users: any[] = [];

  servicesInfo: ServiceInfo =
    {
      totalServices: 0,
      backloggedTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      totalMembers: 0,
      completionRate: 0.0
    }

  columns: any[] = [
    { text: 'Backlog', dataField: 'new', minWidth: 150, collapsible: false },
    { text: 'In Progress', dataField: 'work', minWidth: 150, collapsible: false },
    { text: 'Done', dataField: 'done', minWidth: 150, collapsible: false }
  ];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private location: Location) { }

  ngOnInit(): void
  {
    this.route.params.subscribe(params =>
    {
      this.serviceId = params[ 'serviceId' ];
      this.taskBoardId = params[ 'taskBoardId' ];
    })

    this.getCurrentServiceInfo();
    this.getUsers();
  }

  async getUsers(): Promise<void>
  {
    try
    {
      const response = await this.http.get<any[]>(`${environment.apiUrl}/user/developers`).toPromise();
      this.users = response || [];
    } catch (err)
    {
      console.error('Failed to fetch users', err);
    }
  }

  async getCurrentServiceInfo(): Promise<void>
  {
    this.servicesInfo =
    {
      totalServices: 0,
      backloggedTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      totalMembers: 0,
      completionRate: 0.0
    }

    this.http.get<TaskBoard>(`${environment.apiUrl}/tasks/task-board/${this.taskBoardId}`).subscribe(
      (res) =>
      {
        this.taskBoard = res; // Assuming res is a TaskBoard
        if (this.taskBoard === null) return;
        const service = this.taskBoard.service; // Accessing the service

        if (!service)
        {
          console.error('Service not found in the task board');
          return;
        }

        this.servicesInfo.totalServices = 1; // Since we're getting a single service

        const uniqueMembers = new Set<number>(); // Create a Set to track unique member IDs
        let totalTasksCount = 0;

        // Gather unique members
        if (service.chief) uniqueMembers.add(service.chief.id);
        if (service.projectManager) uniqueMembers.add(service.projectManager.id);
        if (service.assignedResources)
        {
          service.assignedResources.forEach(resource => uniqueMembers.add(resource.id));
        }
        if (service.backup)
        {
          service.backup.forEach(b => uniqueMembers.add(b.id));
        }

        // Initialize task counters
        let serviceBackloggedTasksCount = 0;
        let serviceActiveTasksCount = 0;
        let serviceCompletedTasksCount = 0;

        // Count tasks based on their status
        if (this.taskBoard.cards)
        {
          this.taskBoard.cards.forEach(task =>
          {
            totalTasksCount++;

            if (task.column === 'new')
            {
              serviceBackloggedTasksCount++;
              this.servicesInfo.backloggedTasks++;
            } else if (task.column === 'work')
            {
              serviceActiveTasksCount++;
              this.servicesInfo.activeTasks++;
            } else if (task.column === 'done')
            {
              serviceCompletedTasksCount++;
              this.servicesInfo.completedTasks++;
            }
          });
        }

        // Set the totalMembers from the uniqueMembers Set
        this.servicesInfo.totalMembers = uniqueMembers.size;

        // Calculate the overall completion rate
        this.servicesInfo.completionRate = totalTasksCount > 0
          ? (this.servicesInfo.completedTasks / totalTasksCount) * 100
          : 0;
      },
      (error) =>
      {
        console.log(error);
      }
    );
  }

  async getCurrentServiceInfoFromData(): Promise<void>
  {
    this.servicesInfo =
    {
      totalServices: 0,
      backloggedTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      totalMembers: 0,
      completionRate: 0.0
    }

    if (!this.data)
    {
      console.error('Data not found in the task board');
      return;
    }

    this.servicesInfo.totalServices = 1; // Since we're getting a single service

    let totalTasksCount = 0;

    // Initialize task counters
    let serviceBackloggedTasksCount = 0;
    let serviceActiveTasksCount = 0;
    let serviceCompletedTasksCount = 0;

    // Count tasks based on their status
    if (this.data)
    {
      this.data.forEach(task =>
      {
        totalTasksCount++;

        if (task.status === 'new')
        {
          serviceBackloggedTasksCount++;
          this.servicesInfo.backloggedTasks++;
        } else if (task.status === 'work')
        {
          serviceActiveTasksCount++;
          this.servicesInfo.activeTasks++;
        } else if (task.status === 'done')
        {
          serviceCompletedTasksCount++;
          this.servicesInfo.completedTasks++;
        }
      });
    }

    // Calculate the overall completion rate
    this.servicesInfo.completionRate = totalTasksCount > 0
      ? (this.servicesInfo.completedTasks / totalTasksCount) * 100
      : 0;
  }

  async checkServiceStatus()
  {
    try
    {
      if (this.dataAdapter.localData == undefined || this.dataAdapter.localData[ 0 ].status == "s" || this.dataAdapter.localData.length == 0)
      {
        await this.http.patch<Service>(`${environment.apiUrl}/service/${this.serviceId}/status`, { status: ServiceStatus.New }).toPromise();
        return;
      }

      if (this.dataAdapter.localData.length > 0)
      {
        if (this.servicesInfo.completionRate == 100)
        {
          if (this.taskBoard?.service.status == "Pending Approval" || this.taskBoard?.service.status == "On Hold") return;
          await this.http.patch<Service>(`${environment.apiUrl}/service/${this.serviceId}/status`, { status: ServiceStatus.Completed }).toPromise();
        }
        else
        {
          await this.http.patch<Service>(`${environment.apiUrl}/service/${this.serviceId}/status`, { status: ServiceStatus.InProgress }).toPromise();
        }
      }
      else
      {
        await this.http.patch<Service>(`${environment.apiUrl}/service/${this.serviceId}/status`, { status: ServiceStatus.New }).toPromise();
      }
    }
    catch (err)
    {
      console.log(err);
    }
  }

  async getBoardCards(): Promise<void>
  {
    try
    {
      const response = await this.http.get<TaskCard[]>(`${environment.apiUrl}/service/${this.serviceId}/tasks`).toPromise();

      if (!response || response.length === 0)
      {
        console.log('No tasks found for the service.');
        return;
      }

      this.data = response.map(task => ({
        id: task.id,
        status: task.column,
        text: task.title,
        tags: this.arrayToString(task.tags as string[]),
        description: task.description || '',
        color: task.color === null ? "#008000" : task.color
      }));

      this.data = this.data.map(task =>
      {
        if (typeof task.tags !== 'string' || task.tags.trim() === '')
        {
          task.tags = ' ';
        }
        return task;
      });
    } catch (error)
    {
      console.error('Error fetching board cards:', error);
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

    const selectedTask = this.data.find(x => x.id === item.id);

    this.selectedTask = selectedTask;
    this.showTaskDetailPopup = true;
  }

  async onItemMoved(event: any): Promise<void>
  {
    this.dragInProgress = true;
    this.dragCooldown = true;

    const movedTask = event.args.itemData;

    if (!movedTask)
    {
      console.error('Moved task is undefined');
      this.dragInProgress = false;
      this.dragCooldown = false;
      return;
    }

    const oldStatus = movedTask.status; // Get the old status (column)
    const newStatus = event.args.newColumn.dataField; // Get the new status (column)

    // Update task in the local data array
    const taskToUpdate = this.data.find(task => task.id === movedTask.id);
    if (taskToUpdate)
    {
      // Set the new status
      taskToUpdate.status = newStatus;

      // Update order for tasks in the new column
      await this.updateTaskOrder(newStatus); // Update order for the new column

      // Save the updated task to the backend
      await this.updateTask(taskToUpdate); // Save task with new status and order

      this.getCurrentServiceInfoFromData();
      await this.checkServiceStatus();
    }
    else
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

  private async updateTaskOrder(column: string): Promise<void>
  {
    // Get tasks in the specified column
    const tasksInColumn = this.data.filter(task => task.status === column);

    // Update order for each task based on its position in the column
    for (let index = 0; index < tasksInColumn.length; index++)
    {
      const task = tasksInColumn[ index ];
      task.order = index; // Set the order based on the index

      // Update the task in the backend
      await this.updateTask(task); // Send the updated task to the backend
    }
  }

  private async saveOrUpdateTask(task: any): Promise<void>
  {
    try
    {
      const url = `${environment.apiUrl}/service/${this.serviceId}/tasks/${task.id}`;
      // Assuming you have a PUT or POST endpoint based on whether the task exists
      const response = await this.http.put(url, task).toPromise(); // Use PUT for updates
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

  public textToArray(text: string): string[]
  {
    if (typeof text !== 'string')
    {
      console.warn('Expected a string but received:', text);
      return [ " " ]; // Return an empty array if not a string
    }
    return text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  public arrayToString(array: string[]): string
  {
    if (!array || array.length === 0) return '';
    return array.join(', ');
  }

  onTaskAdded(task: { text: string; tags: string; description: string; color: string; assigneeId?: number })
  {
    this.createTask(task.text, 'backlog', task.tags, task.description, task.color, task.assigneeId);
  }



  async initializeKanbanDataSource(): Promise<void>
  {
    await this.getBoardCards();

    if (this.data.length == 0)
    {
      this.data = [ { id: '1', status: 's', text: 'eee', tags: 'ss', description: 'ssssee', assignee: "John sp", color: '#C21A25' } ]
    }

    this.dataAdapter = new jqx.dataAdapter({
      localData: this.data,
      dataType: 'array',
      dataFields: [
        { name: 'id', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'text', type: 'string' },
        { name: 'tags', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'assignee', type: 'string' },
        { name: 'color', type: 'string' }
      ]
    });

    this.dataAdapter.localData = this.data;
    this.rebuildKanban();

    this.checkServiceStatus();
  }

  addTask(column: string, taskText: string, tagsText: string, assigneeId?: number)
  {
    const newTaskOrder = this.data.filter(task => task.status === 'new').length;

    const newTask = {
      id: (this.data.length + 1).toString(),
      status: column,
      text: taskText,
      tags: this.textToArray(tagsText),
      order: newTaskOrder,
      assigneeId: assigneeId ?? null
    };

    this.data.push(newTask);

    this.dataAdapter.localData = this.data;
    this.rebuildKanban();

    this.closePopup();

    this.checkServiceStatus();
  }

  async rebuildKanban()
  {
    if (this.kanban)
    {
      this.kanban.destroy();
    }

    this.showKanban = false;

    await this.getBoardCards();

    setTimeout(() =>
    {
      this.dataAdapter = new jqx.dataAdapter(this.data);
      this.showKanban = true;
    }, 0);
  }


  async createTask(title: string, column: string, tags: string, description: string, color: string, assigneeId?: number): Promise<void>
  {
    const formattedTags = tags ? this.textToArray(tags) : [];
    const newTask: any = {
      title,
      column,
      description,
      tags: formattedTags,
      color,
      assigneeId: assigneeId ?? null // ✅ send selected user ID
    };

    try
    {
      const response = await this.http.post<TaskCard>(
        `${environment.apiUrl}/service/${this.taskBoardId}/cards`,
        newTask,
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise();

      if (response)
      {
        this.data.push({
          id: response.id,
          text: title,
          status: column,
          description,
          tags: formattedTags,
          color,
          assignee: response.assignee ? response.assignee.id : assigneeId ?? null
        });

        this.dataAdapter.localData = this.data;
        this.rebuildKanban();
      }
    } catch (err)
    {
      console.error('Error creating task:', err);
    }
  }

  async updateTask(task: any): Promise<void>
  {
    if (!task || !task.id)
    {
      console.error('Invalid task object:', task);
      return;
    }

    const payload = {
      column: task.status, // This represents the column (status)
      title: task.text, // Ensure title is from the task object
      description: task.description || '', // Optional
      tags: Array.isArray(task.tags) ? task.tags : this.textToArray(task.tags) || [], // Ensure it's an array
      order: task.order,
      color: task.color === null ? "#008000" : task.color,
      assigneeId: task.assignee ?? null
    };

    try
    {
      const response = await this.http.patch<TaskCard>(
        `${environment.apiUrl}/service/${this.taskBoardId}/tasks/${task.id}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      ).toPromise();

      const index = this.data.findIndex(x => x.id === task.id);
      if (index !== -1)
      {
        this.data[ index ] = {
          ...this.data[ index ],
          text: payload.title,
          description: payload.description,
          tags: payload.tags,
          color: payload.color
        };
      }

      this.dataAdapter.localData = this.data;
    } catch (error)
    {
      console.error('Error updating task:', error);
    }
  }

  async deleteTask(taskId: number): Promise<void>
  {
    try
    {
      const url = `${environment.apiUrl}/service/${this.taskBoardId}/tasks/${taskId}`;
      await this.http.delete(url).toPromise(); // Call the delete API
      this.data = this.data.filter(task => task.id !== taskId); // Remove from local data
      this.dataAdapter.localData = this.data;
      this.rebuildKanban();
      this.closeTaskDetailPopup();
      this.initializeKanbanDataSource();
    } catch (error)
    {
      console.error('Error deleting task:', error);
    }
  }

  goBack()
  {
    this.location.back();
  }

  formatDecimal(num: number): string
  {
    // Round to one decimal place to handle cases like 1.123 -> 1.1 or 1.987 -> 2.0
    const roundedNum = Math.round(num * 10) / 10;

    // Convert to string
    let result = String(roundedNum);

    // Remove trailing .0 if present
    if (result.endsWith(".0"))
    {
      result = result.substring(0, result.length - 2);
    }

    return result;
  }

  async updateTaskDescription(taskId: number, description: string)
  {
    const payload = { description }; // Prepare the payload

    return this.http.patch(`${environment.apiUrl}/tasks/${taskId}`, payload).toPromise(); // Adjust the URL as necessary
  }


  selectSection(isTaskboard: boolean)
  {
    this.isTaskboardSelected = isTaskboard;
    this.initializeKanbanDataSource();
  }

  saveChanges(): void
  {
    this.http.patch<TaskBoard>(`${environment.apiUrl}/service/${this.taskBoard?.service.serviceID}`, this.taskBoard?.service).subscribe();

    this.toggleEdit();
  }

  toggleEdit()
  {
    this.editMode = !this.editMode;
    if (!this.editMode)
    {
      this.getCurrentServiceInfo();
    }
  }

}
