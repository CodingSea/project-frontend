import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { jqxKanbanComponent, jqxKanbanModule } from "jqwidgets-ng/jqxkanban";
import { jqxSplitterModule } from 'jqwidgets-ng/jqxsplitter';
import { AddTaskPopup } from '@app/add-task-popup/add-task-popup';
import { TaskPopup } from '@app/task-popup/task-popup';

@Component({
  selector: 'app-service-tasks',
  templateUrl: './service.tasks.component.html',
  styleUrls: [ './service.tasks.component.css' ],
  imports: [ jqxKanbanModule, jqxSplitterModule, CommonModule, AddTaskPopup, TaskPopup ]
})
export class ServiceTasksComponent implements OnInit, AfterViewInit 
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

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit()
  {
    this.data = [
      { id: '1', status: 'new', text: 'Task 1', tags: 'tag1' },
      { id: '2', status: 'work', text: 'Task 2', tags: 'tag2' },
      { id: '3', status: 'done', text: 'Task 3', tags: 'tag1,tag2' },
      { id: '3', status: 'done', text: 'Task 4', tags: 'css,html' }
    ];

    this.initializeKanbanDataSource();
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

  onItemMoved(event: any): void
  {
    this.dragInProgress = true;
    this.dragCooldown = true;

    setTimeout(() =>
    {
      this.dragInProgress = false;
    }, 0);

    setTimeout(() =>
    {
      this.dragCooldown = false;
    }, 300);
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

  onTaskAdded(task: { text: string; tags: string })
  {
    const newTask = {
      id: (this.data.length + 1).toString(),
      status: 'new',
      text: task.text,
      tags: task.tags
    };

    this.data.push(newTask);
    this.dataAdapter.localdata = this.data;
    this.rebuildKanban();
    this.kanban.source = this.dataAdapter;
    this.closePopup();
    this.cdr.detectChanges();
  }

  initializeKanbanDataSource(): void
  {
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
  }

  addTask(column: string, taskText: string, tagsText: string)
  {
    const newTask = {
      id: (this.data.length + 1).toString(),
      status: column,
      text: taskText,
      tags: tagsText
    };

    this.data.push(newTask);
    console.log('Current Data after adding task:', this.data);

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
}
