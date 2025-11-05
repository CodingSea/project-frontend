import { CommonModule, Location } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { jqxKanbanComponent, jqxKanbanModule } from 'jqwidgets-ng/jqxkanban';
import { jqxSplitterModule } from 'jqwidgets-ng/jqxsplitter';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { TaskBoard } from '@app/task-board';
import { TaskCard } from '@app/task-card';
import { ServiceInfo } from '@app/service-info';
import { Service, ServiceStatus } from '@app/service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Sidebar } from '@app/sidebar/sidebar';
import { HeaderComponent } from '@app/header/header';
import { IssuePageTemplate } from '@app/issue-page/issue-page-template';

@Component({
  selector: 'app-service-tasks',
  templateUrl: './service.tasks.component.html',
  styleUrls: ['./service.tasks.component.css'],
  imports: [jqxKanbanModule, jqxSplitterModule, CommonModule, FormsModule, Sidebar, HeaderComponent, IssuePageTemplate],
  standalone: true
})
export class ServiceTasksComponent implements OnInit, AfterViewInit {
  @ViewChild('kanbanReference') kanban!: jqxKanbanComponent;

  // view state
  showKanban = true;
  isTaskboardSelected = true;
  editMode = false;

  // data
  data: any[] = [];
  dataAdapter: any;
  taskBoard: TaskBoard | null = null;
  serviceId!: number;
  taskBoardId!: number;

  // modals
  showCreateModal = false;
  showEditModal = false;

  // ===================== form models (with priority) =====================
  createModel = {
    title: '',
    description: '',
    tags: '',
    priority: 'low' as 'low'|'medium'|'high',
    color: '#16a34a'
  };

  editModel = {
    id: 0,
    title: '',
    description: '',
    tags: '',
    priority: 'low' as 'low'|'medium'|'high',
    color: '#16a34a',
    column: 'new' as 'new'|'work'|'done'
  };

  // priority <-> color helpers
  updatePriorityColor(task: { priority: 'low'|'medium'|'high'; color: string }) {
    if (!task) return;
    if (task.priority === 'low') task.color = '#16a34a';
    if (task.priority === 'medium') task.color = '#eab308';
    if (task.priority === 'high') task.color = '#dc2626';
  }

  private colorToPriority(color?: string): 'low'|'medium'|'high' {
    switch ((color || '').toLowerCase()) {
      case '#dc2626': return 'high';
      case '#eab308': return 'medium';
      default: return 'low';
    }
  }

  servicesInfo: ServiceInfo = {
    totalServices: 0,
    backloggedTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalMembers: 0,
    completionRate: 0.0
  };

  columns: any[] = [
    { text: 'Backlog', dataField: 'new', minWidth: 150, collapsible: false },
    { text: 'In Progress', dataField: 'work', minWidth: 150, collapsible: false },
    { text: 'Done', dataField: 'done', minWidth: 150, collapsible: false }
  ];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.serviceId = params['serviceId'];
      this.taskBoardId = params['taskBoardId'];
      this.initializeKanbanDataSource();
      this.getCurrentServiceInfo();
    });
  }

  ngAfterViewInit() {}

  /* -------------------- Info / Progress -------------------- */
  async getCurrentServiceInfo(): Promise<void> {
    this.servicesInfo = {
      totalServices: 0, backloggedTasks: 0, activeTasks: 0,
      completedTasks: 0, totalMembers: 0, completionRate: 0.0
    };

    this.http.get<TaskBoard>(`${environment.apiUrl}/tasks/task-board/${this.taskBoardId}`)
      .subscribe((res) => {
        this.taskBoard = res;
        if (!this.taskBoard) return;

        const service = this.taskBoard.service;
        if (!service) return;

        this.servicesInfo.totalServices = 1;

        const uniqueMembers = new Set<number>();
        if (service.chief) uniqueMembers.add(service.chief.id);
        if (service.projectManager) uniqueMembers.add(service.projectManager.id);
        service.assignedResources?.forEach(r => uniqueMembers.add(r.id));
        service.backup?.forEach(b => uniqueMembers.add(b.id));

        this.servicesInfo.totalMembers = uniqueMembers.size;

        let total = 0;
        this.servicesInfo.backloggedTasks = 0;
        this.servicesInfo.activeTasks = 0;
        this.servicesInfo.completedTasks = 0;

        this.taskBoard.cards?.forEach(t => {
          total++;
          if (t.column === 'new') this.servicesInfo.backloggedTasks++;
          else if (t.column === 'work') this.servicesInfo.activeTasks++;
          else if (t.column === 'done') this.servicesInfo.completedTasks++;
        });

        this.servicesInfo.completionRate = total > 0 ? (this.servicesInfo.completedTasks / total) * 100 : 0;
      });
  }

  async getCurrentServiceInfoFromData(): Promise<void> {
    const total = this.data.length;
    this.servicesInfo.backloggedTasks = this.data.filter(t => t.status === 'new').length;
    this.servicesInfo.activeTasks = this.data.filter(t => t.status === 'work').length;
    this.servicesInfo.completedTasks = this.data.filter(t => t.status === 'done').length;
    this.servicesInfo.completionRate = total > 0 ? (this.servicesInfo.completedTasks / total) * 100 : 0;
  }

  async checkServiceStatus() {
    try {
      if (!this.dataAdapter?.localData || this.dataAdapter.localData.length === 0 || this.dataAdapter.localData[0].status === 's') {
        await this.http.patch<Service>(`${environment.apiUrl}/service/${this.serviceId}/status`, { status: ServiceStatus.New }).toPromise();
        return;
      }

      if (this.servicesInfo.completionRate === 100) {
        if (this.taskBoard?.service.status === 'Pending Approval' || this.taskBoard?.service.status === 'On Hold') return;

        await this.http.patch<Service>(`${environment.apiUrl}/service/${this.serviceId}/status`, { status: ServiceStatus.Completed }).toPromise();
      } else {
        await this.http.patch<Service>(`${environment.apiUrl}/service/${this.serviceId}/status`, { status: ServiceStatus.InProgress }).toPromise();
      }
    } catch (err) {
      console.log(err);
    }
  }

  /* -------------------- Board Data -------------------- */
  async getBoardCards(): Promise<void> {
    try {
      const response = await this.http.get<TaskCard[]>(`${environment.apiUrl}/service/${this.serviceId}/tasks`).toPromise();

      if (!response || response.length === 0) {
        this.data = [];
        return;
      }

      this.data = response.map(task => ({
        id: task.id,
        status: task.column,
        text: task.title,
        tags: this.arrayToString(task.tags as string[]),
        description: task.description || '',
        color: task.color === null ? '#008000' : task.color
      })).map(t => ({
        ...t,
        tags: (typeof t.tags === 'string' && t.tags.trim() !== '') ? t.tags : ' '
      }));
    } catch (e) {
      console.error('Error fetching board cards:', e);
      this.data = [];
    }
  }

  async initializeKanbanDataSource(): Promise<void> {
    await this.getBoardCards();

    if (this.data.length === 0) {
      this.data = [{
        id: '1',
        status: 's',
        text: 'eee',
        tags: 'ss',
        description: 'ssssee',
        assignee: 'John sp',
        color: '#C21A25'
      }];
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

    await this.rebuildKanban();
    await this.checkServiceStatus();
  }

  async rebuildKanban() {
    if (this.kanban) this.kanban.destroy();
    this.showKanban = false;

    await this.getBoardCards();

    setTimeout(() => {
      this.dataAdapter = new jqx.dataAdapter(this.data);
      this.showKanban = true;

      setTimeout(() => {
        if (this.kanban && this.kanban.host) {
          (this.kanban as any).itemRenderer = this.kanbanItemRenderer;
        }
      }, 50);
    }, 0);
  }

  /* -------------------- Helpers -------------------- */
  textToArray(text: string): string[] {
    if (typeof text !== 'string') return [' '];
    return text.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  arrayToString(arr: string[]): string {
    if (!arr || arr.length === 0) return '';
    return arr.join(', ');
  }

  formatDecimal(num: number): string {
    const r = Math.round(num * 10) / 10;
    const s = String(r);
    return s.endsWith('.0') ? s.slice(0, -2) : s;
  }

  /* -------------------- Modal Openers -------------------- */
  openCreateModal() {
    this.createModel = { title: '', description: '', tags: '', priority: 'low', color: '#16a34a' };
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openEditModal(item: any) {
    const t = this.data.find(x => x.id === item.id);
    if (!t) return;

    const priority = this.colorToPriority(t.color);

    this.editModel = {
      id: Number(t.id),
      title: t.text,
      description: t.description || '',
      tags: typeof t.tags === 'string' ? t.tags : this.arrayToString(t.tags),
      priority,
      color: t.color || '#16a34a',
      column: (t.status as 'new'|'work'|'done') || 'new'
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  /* -------------------- Create / Update / Delete -------------------- */
  async submitCreateTask() {
    this.updatePriorityColor(this.createModel);
    await this.createTask(
      this.createModel.title,
      'new',
      this.createModel.tags,
      this.createModel.description,
      this.createModel.color
    );
    this.closeCreateModal();
  }

  async submitEditTask() {
    this.updatePriorityColor(this.editModel);

    const payload = {
      id: this.editModel.id,
      status: this.editModel.column,
      text: this.editModel.title,
      description: this.editModel.description,
      tags: this.editModel.tags,
      color: this.editModel.color,
      order: this.data.findIndex(d => Number(d.id) === this.editModel.id)
    };

    await this.updateTask(payload);
    await this.rebuildKanban();
    await this.getCurrentServiceInfoFromData();
    await this.checkServiceStatus();
    this.closeEditModal();
  }

  confirmDelete() {
    if (!this.editModel?.id) return;
    this.deleteTask(this.editModel.id);
    this.closeEditModal();
  }

  async onItemMoved(event: any): Promise<void> {
    const movedTask = event.args.itemData;
    if (!movedTask) return;

    const newStatus = event.args.newColumn.dataField;
    const t = this.data.find(task => task.id === movedTask.id);

    if (t) {
      t.status = newStatus;
      await this.updateTaskOrder(newStatus);
      await this.updateTask(t);
      await this.getCurrentServiceInfoFromData();
      await this.checkServiceStatus();
    }
  }

  private async updateTaskOrder(column: string): Promise<void> {
    const tasksInColumn = this.data.filter(task => task.status === column);
    for (let i = 0; i < tasksInColumn.length; i++) {
      const task = tasksInColumn[i];
      (task as any).order = i;
      await this.updateTask(task);
    }
  }

  async createTask(taskText: string, column: string, tagsText: string, description: string, color: string): Promise<void> {
    const formattedTags = tagsText.length === 0 ? [' '] : this.textToArray(tagsText);
    const newTaskOrder = this.data.filter(task => task.status === 'new').length;

    const newTask: TaskCard = {
      title: taskText, column, description, tags: formattedTags, order: newTaskOrder, color
    };

    try {
      const response = await this.http.post<TaskCard>(
        `${environment.apiUrl}/service/${this.taskBoardId}/cards`,
        newTask, { headers: { 'Content-Type': 'application/json' } }
      ).toPromise();

      const created = response!;
      this.data.push({
        id: created?.id, status: column, text: taskText, description,
        tags: formattedTags, order: newTaskOrder, color
      });

      this.dataAdapter.localData = this.data;
      await this.rebuildKanban();
      await this.getCurrentServiceInfo();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }

  async updateTask(task: any): Promise<void> {
    if (!task || !task.id) return;

    const payload = {
      column: task.status,
      title: task.text,
      description: task.description || '',
      tags: Array.isArray(task.tags) ? task.tags : this.textToArray(task.tags) || [],
      order: task.order,
      color: task.color === null ? '#008000' : task.color
    };

    try {
      await this.http.patch<TaskCard>(
        `${environment.apiUrl}/service/${this.taskBoardId}/tasks/${task.id}`,
        payload, { headers: { 'Content-Type': 'application/json' } }
      ).toPromise();

      const idx = this.data.findIndex(x => x.id === task.id);
      if (idx !== -1) {
        this.data[idx] = {
          ...this.data[idx],
          text: payload.title,
          description: payload.description,
          tags: payload.tags,
          color: payload.color,
          status: payload.column
        };
      }

      this.dataAdapter.localData = this.data;
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  async deleteTask(taskId: number): Promise<void> {
    try {
      const url = `${environment.apiUrl}/service/${this.taskBoardId}/tasks/${taskId}`;
      await this.http.delete(url).toPromise();

      this.data = this.data.filter(task => Number(task.id) !== Number(taskId));
      this.dataAdapter.localData = this.data;

      await this.rebuildKanban();
      await this.initializeKanbanDataSource();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  /* navigation + misc */
  goBack() {
    this.location.back();
  }

  selectSection(isTaskboard: boolean) {
    this.isTaskboardSelected = isTaskboard;
    this.initializeKanbanDataSource();
  }

  saveChanges(): void {
    this.http.patch<TaskBoard>(`${environment.apiUrl}/service/${this.taskBoard?.service.serviceID}`, this.taskBoard?.service).subscribe();
    this.toggleEdit();
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (!this.editMode) this.getCurrentServiceInfo();
  }

  kanbanItemRenderer = (element: any, item: any, resource: any) => {
    const tags = (item.tags || '').split(',').filter((x: string) => x.trim());
    const priority = item.color === '#dc2626' ? 'high' : item.color === '#eab308' ? 'medium' : 'low';

    element.innerHTML =
      `<div class="kanban-card">
        <div class="k-card-top">
          <span class="k-card-title">${item.text}</span>
          <span class="k-priority ${priority}">${priority}</span>
        </div>
        <div class="k-card-desc">${item.description || ''}</div>
        <div class="k-tags">
          ${tags.map((t: string) => `<span class="k-tag">${t.trim()}</span>`).join('')}
        </div>
      </div>`;
  };
}
