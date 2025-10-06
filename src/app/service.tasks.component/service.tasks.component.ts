import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { jqxKanbanComponent, jqxKanbanModule } from "jqwidgets-ng/jqxkanban";
import { jqxSplitterModule } from 'jqwidgets-ng/jqxsplitter';

@Component({
  selector: 'app-service-tasks',
  templateUrl: './service.tasks.component.html',
  styleUrls: [ './service.tasks.component.css' ],
  imports: [ jqxKanbanModule, jqxSplitterModule, CommonModule ]
})
export class ServiceTasksComponent implements OnInit, AfterViewInit 
{
  @ViewChild('kanbanReference') kanban!: jqxKanbanComponent;

  showKanban = true;

  data: any[] = []; // Local data array for tasks
  dataAdapter: any; // Data adapter for Kanban

  columns: any[] = [
    { text: 'Backlog', dataField: 'new', minWidth: 150 },
    { text: 'In Progress', dataField: 'work', minWidth: 150 },
    { text: 'Done', dataField: 'done', minWidth: 150 }
  ];

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit()
  {
    // Initialize the data array with some default tasks
    this.data = [
      { id: '1', status: 'new', text: 'Task 1', tags: 'tag1' },
      { id: '2', status: 'work', text: 'Task 2', tags: 'tag2' },
      { id: '3', status: 'done', text: 'Task 3', tags: 'tag1,tag2' }
    ];

    // Initialize the dataAdapter
    this.initializeKanbanDataSource();
  }

  ngAfterViewInit()
  {
    // Set the initial source for the Kanban
    this.initializeKanbanDataSource();
  }

  initializeKanbanDataSource(): void
  {
    this.dataAdapter = new jqx.dataAdapter({
      localData: this.data,
      dataType: 'array',
      dataFields: [
        { name: 'id', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'text', type: 'string' }
      ]
    });
  }

  addTask(column: string, taskText: string)
  {
    const newTask = {
      id: (this.data.length + 1).toString(), // Generate a new ID
      status: column, // Set the state to the column
      text: taskText
    };

    // Update the local data array
    this.data.push(newTask);
    console.log('Current Data after adding task:', this.data); // Log updated data

    // Update the dataAdapter's localData to reflect the new data
    this.dataAdapter.localdata = this.data; // Update the local data of the dataAdapter
    this.rebuildKanban();
  }

  rebuildKanban() {
    if (this.kanban) {
      this.kanban.destroy(); // fully destroy the instance
    }

    // Hide and show the Kanban again after a tick to reinsert it into DOM
    this.showKanban = false;

    // Allow Angular to process *ngIf change
    setTimeout(() => {
      this.dataAdapter = new jqx.dataAdapter(this.dataAdapter);
      this.showKanban = true;
    }, 0);
  }
}
