



import { CommonModule, Location } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { jqxKanbanComponent, jqxKanbanModule } from 'jqwidgets-ng/jqxkanban';
import { jqxSplitterModule } from 'jqwidgets-ng/jqxsplitter';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { TaskBoard } from '@app/task-board';
import { TaskCard } from '@app/task-card';
import { ServiceInfo } from '@app/service-info';
import { Service, ServiceStatus } from '@app/service';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Sidebar } from '@app/sidebar/sidebar';
import { HeaderComponent } from '@app/header/header';
import { IssuePageTemplate } from '@app/issue-page/issue-page-template';
import { User, UserService } from '@app/services/user.service';

@Component({
  selector: 'app-service-tasks',
  templateUrl: './service.tasks.component.html',
  styleUrls: ['./service.tasks.component.css'],
  imports: [
    jqxKanbanModule,
    jqxSplitterModule,
    CommonModule,
    FormsModule,
    Sidebar,
    HeaderComponent,
    IssuePageTemplate
  ],
  standalone: true
})
export class ServiceTasksComponent implements OnInit, AfterViewInit {
  @ViewChild('kanbanReference') kanban!: jqxKanbanComponent;

  showKanban = true;
  isTaskboardSelected = true;
  editMode = false;

  data: any[] = [];
  dataAdapter: any;
  taskBoard: TaskBoard | null = null;

  serviceId!: number;
  taskBoardId!: number;

  showCreateModal = false;
  showEditModal = false;

  users: User[] = [];

  currentUser: User | null | undefined = null;
  isChief = false;
  isManager = false;
  isResource = false;
  isAdmin = false;

  createModel = {
    title: '',
    description: '',
    tags: '',
    priority: 'low' as 'low' | 'medium' | 'high',
    color: '#16a34a',
    assignedUserIds: [] as number[]
  };

  editModel = {
    id: 0,
    title: '',
    description: '',
    tags: '',
    priority: 'low' as 'low' | 'medium' | 'high',
    color: '#16a34a',
    column: 'new' as 'new' | 'work' | 'done',
    assignedUserIds: [] as number[]
  };

  dropdownOpenCreate = false;
  dropdownOpenEdit = false;

  servicesInfo: ServiceInfo = {
    totalServices: 0,
    backloggedTasks: 0,
    activeTasks: 0,
    completedTasks: 0,
    totalMembers: 0,
    completionRate: 0
  };

  columns: any[] = [
    { text: 'Backlog', dataField: 'new', minWidth: 150 },
    { text: 'In Progress', dataField: 'work', minWidth: 150 },
    { text: 'Done', dataField: 'done', minWidth: 150 }
  ];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router,
    private userService: UserService
  ) {}

  async ngOnInit(): Promise<void> {
    window.scroll({ top: 0, left: 0 });

    this.route.params.subscribe(async params => {
      this.serviceId = params['serviceId'];
      this.taskBoardId = params['taskBoardId'];

      await this.loadCurrentUserAndRoles();
      await this.initializeKanbanDataSource();
this.recalculateServiceInfoFromLocal();
      await this.loadAssignedUsers();
      await this.checkServiceStatus();
    });
  }

  ngAfterViewInit() {}

  private getUserFromToken(): User | null {
    try {
      const token =
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        localStorage.getItem('jwt');

      if (!token) return null;

      const payloadJson = atob(token.split('.')[1]);
      const payload: any = JSON.parse(payloadJson);

      return {
        id: Number(payload.id || payload.userId || payload.sub),
        first_name: payload.first_name || payload.firstName || '',
        last_name: payload.last_name || payload.lastName || '',
        email: payload.email || '',
        role: payload.role || payload.userType || '',
        skills: []
      };
    } catch {
      return null;
    }
  }

  async loadCurrentUserAndRoles(): Promise<void> {
    this.currentUser = this.getUserFromToken();
    if (!this.currentUser) return;

    const service = await this.http
      .get<Service>(`${environment.apiUrl}/service/${this.serviceId}`)
      .toPromise();

    if (!service) return;

    const userId = Number(this.currentUser.id);
    const role = (this.currentUser.role || '').toLowerCase();

    this.isAdmin = role === 'admin';
    this.isChief = !!service.chief && Number(service.chief.id) === userId;
    this.isManager = !!service.projectManager && Number(service.projectManager.id) === userId;

    this.isResource =
      Array.isArray(service.assignedResources) &&
      service.assignedResources.some(r => Number(r.id) === userId);
  }

  updatePriorityColor(task: { priority: 'low' | 'medium' | 'high'; color: string }) {
    if (task.priority === 'low') task.color = '#16a34a';
    if (task.priority === 'medium') task.color = '#eab308';
    if (task.priority === 'high') task.color = '#dc2626';
  }

  private colorToPriority(color: string): 'low' | 'medium' | 'high' {
    if (color === '#dc2626') return 'high';
    if (color === '#eab308') return 'medium';
    return 'low';
  }

  textToArray(text: string | string[]): string[] {
    if (Array.isArray(text)) return text;
    if (!text || typeof text !== 'string') return [];
    return text.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  arrayToString(arr: any): string {
    if (!arr) return '';
    if (Array.isArray(arr)) return arr.join(', ');
    return arr;
  }

  async loadAssignedUsers(): Promise<void> {
    const service = await this.http
      .get<Service>(`${environment.apiUrl}/service/${this.serviceId}`)
      .toPromise();

    if (!service) {
      this.users = [];
      return;
    }

    const assigned: User[] = [];

    if (service.chief) assigned.push(service.chief);
    if (service.projectManager) assigned.push(service.projectManager);
    if (service.assignedResources) assigned.push(...service.assignedResources);
    if (service.backup) assigned.push(...service.backup);

    const unique = new Map<number, User>();
    assigned.forEach(u => unique.set(u.id, u));

    this.users = Array.from(unique.values());
  }

  async getCurrentServiceInfo(): Promise<void> {
    const res = await this.http
      .get<TaskBoard>(`${environment.apiUrl}/tasks/task-board/${this.taskBoardId}`)
      .toPromise();

    this.taskBoard = res || null;

this.servicesInfo.backloggedTasks = 0;
this.servicesInfo.activeTasks = 0;
this.servicesInfo.completedTasks = 0;


    if (!res || !res.service) return;

    const service: any = res.service;

    const members = new Set<number>();
    if (service.chief) members.add(service.chief.id);
    if (service.projectManager) members.add(service.projectManager.id);
    service.assignedResources?.forEach((r: any) => members.add(r.id));
    service.backup?.forEach((b: any) => members.add(b.id));

    this.servicesInfo.totalMembers = members.size;

    let total = 0;
    res.cards?.forEach(t => {
      total++;
      if (t.column === 'new') this.servicesInfo.backloggedTasks++;
      if (t.column === 'work') this.servicesInfo.activeTasks++;
      if (t.column === 'done') this.servicesInfo.completedTasks++;
    });

    this.servicesInfo.totalServices = 1;
    this.servicesInfo.completionRate =
      total > 0 ? (this.servicesInfo.completedTasks / total) * 100 : 0;
  }

  async getBoardCards(): Promise<void> {
    const response = await this.http
      .get<TaskCard[]>(`${environment.apiUrl}/service/${this.serviceId}/tasks`)
      .toPromise();

    if (!response) {
      this.data = [];
      return;
    }

    this.data = response.map(task => ({
      id: String(task.id),
      status: task.column,
      text: task.title,
      tags: this.arrayToString(task.tags),
      description: task.description || '',
      color: task.color || '#16a34a',
      order: task.order || 0,

      // 🔥 FIXED TYPE ERROR HERE
      assignedUserIds:
        Array.isArray(task.users)
          ? task.users.map((u: any) => (typeof u === 'number' ? u : u.id))
          : []
    }));
  }

  async initializeKanbanDataSource(): Promise<void> {
    await this.getBoardCards();

    this.dataAdapter = new (window as any).jqx.dataAdapter({
      localData: this.data,
      dataType: 'array',
      dataFields: [
        { name: 'id', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'text', type: 'string' },
        { name: 'tags', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'order', type: 'number' },
        { name: 'assignedUserIds', type: 'array' }
      ]
    });

    this.dataAdapter.localData = this.data;
    await this.rebuildKanban();
  }

  async rebuildKanban(): Promise<void> {
    if (this.kanban) this.kanban.destroy();

    this.showKanban = false;
    await new Promise(res => setTimeout(res, 50));

    this.showKanban = true;

    setTimeout(() => {
      if (this.kanban && this.kanban.host) {
        (this.kanban as any).itemRenderer = this.kanbanItemRenderer;
      }
    }, 100);
  }

  async checkServiceStatus(): Promise<void> {
this.recalculateServiceInfoFromLocal();

    if (!this.data || this.data.length === 0) {
      await this.http
        .patch(`${environment.apiUrl}/service/${this.serviceId}/status`, {
          status: ServiceStatus.New
        })
        .toPromise();
      return;
    }

    if (this.taskBoard?.service.status === 'On Hold') return;

    if (this.servicesInfo.completionRate === 100) {
      if (this.taskBoard?.service.status === 'Pending Approval') return;

      await this.http
        .patch(`${environment.apiUrl}/service/${this.serviceId}/status`, {
          status: ServiceStatus.Completed
        })
        .toPromise();
    } else {
      await this.http
        .patch(`${environment.apiUrl}/service/${this.serviceId}/status`, {
          status: ServiceStatus.InProgress
        })
        .toPromise();
    }
  }
async onItemMoved(event: any): Promise<void> {
  const item = event.args.itemData;
  if (!item) return;

  const newColumn = event.args.newColumn.dataField;
  const task = this.data.find(t => t.id === String(item.id));

  if (!task) return;

  task.status = newColumn;

  // update order in memory
  const tasksInColumn = this.data.filter(t => t.status === newColumn);
  tasksInColumn.forEach((t, idx) => t.order = idx);

  // send update to backend
  await this.updateTask(task);

  // 🔥 DO NOT REBUILD KANBAN HERE (fixes glitch)
  // await this.initializeKanbanDataSource();

this.recalculateServiceInfoFromLocal();
  await this.checkServiceStatus();
  await this.reloadTaskBoard();
}


  async updateTaskOrder(column: string): Promise<void> {
    const tasks = this.data.filter(t => t.status === column);

    for (let i = 0; i < tasks.length; i++) {
      tasks[i].order = i;
      await this.updateTask(tasks[i]);
    }
  }

  async submitCreateTask(): Promise<void> {
if (!(this.isChief || this.isManager || this.isAdmin)) return;

    this.updatePriorityColor(this.createModel);

    await this.createTask(
      this.createModel.title,
      'new',
      this.createModel.tags,
      this.createModel.description,
      this.createModel.color,
      this.createModel.assignedUserIds
    );
    // 🔥 Refresh local progress bar
this.recalculateServiceInfoFromLocal();

// 🔥 Refresh backend service info
await this.reloadTaskBoard();

// 🔥 Force HTML to detect changes
if (this.taskBoard?.service) {
  this.taskBoard.service.completionRate = this.servicesInfo.completionRate;
}


    this.closeCreateModal();
  }

async createTask(
  taskText: string,
  column: string,
  tagsText: string,
  description: string,
  color: string,
  assignedUserIds: number[]
): Promise<void> {

  const formattedTags = tagsText.length === 0 ? [' '] : this.textToArray(tagsText);

  const newTask = {
    title: taskText,
    column,
    description,
    tags: formattedTags,
    color,
    users: assignedUserIds,
    order: this.data.length + 1
  };

  try {
    const created: any = await this.http
      .post(`${environment.apiUrl}/service/${this.taskBoardId}/cards`, newTask)
      .toPromise();

    const newCard = {
      id: String(created.id),
      status: created.column,
      text: created.title,
      tags: this.arrayToString(created.tags),
      description: created.description || '',
      color: created.color || '#16a34a',
      assignedUserIds: created.users?.map((u: any) => u.id) || []
    };

    this.data.push(newCard);

    if (this.kanban) {
      (this.kanban as any).source(this.data);
      (this.kanban as any).update();
    }
// Wait for backend to finish writing the new task
await new Promise(res => setTimeout(res, 300));

// DON'T reload from backend — backend is slow
this.data.push(newCard);

// Update UI directly
if (this.kanban) {
  (this.kanban as any).source(this.data);
  (this.kanban as any).update();
}

this.recalculateServiceInfoFromLocal();
await this.checkServiceStatus();

// refresh from backend AFTER 1 second (backend delay)
setTimeout(async () => {
  await this.initializeKanbanDataSource();
  await this.reloadTaskBoard();
  this.recalculateServiceInfoFromLocal();
}, 1000);
this.recalculateServiceInfoFromLocal();
await this.checkServiceStatus();
await this.reloadTaskBoard();


    await new Promise(r => setTimeout(r));



  } catch (error) {
    console.error('Error creating task:', error);
  }
}


  openEditModal(item: any) {
    if (!this.isChief && !this.isAdmin) return;

    const t = this.data.find(x => x.id === String(item.id));
    if (!t) return;

    this.editModel = {
      id: Number(t.id),
      title: t.text,
      description: t.description,
      tags: this.arrayToString(t.tags),
      priority: this.colorToPriority(t.color),
      color: t.color,
      column: t.status as 'new' | 'work' | 'done',
      assignedUserIds: t.assignedUserIds
    };

    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

async submitEditTask(): Promise<void> {
  if (!(this.isChief || this.isAdmin)) return;

  this.updatePriorityColor(this.editModel);

  const tagsArray =
    this.editModel.tags.trim().length === 0
      ? [' ']                               // same default as createTask
      : this.textToArray(this.editModel.tags);

  const payload = {
    id: this.editModel.id,
    status: this.editModel.column,
    text: this.editModel.title,
    description: this.editModel.description,
    tags: tagsArray,
    color: this.editModel.color,
    assignedUserIds: this.editModel.assignedUserIds,
    order: this.data.findIndex(d => d.id === String(this.editModel.id))
  };

  await this.updateTask(payload);
  await this.checkServiceStatus();
await this.reloadTaskBoard();
  this.closeEditModal();
}


async updateTask(task: any, skipRebuild = false): Promise<void> {
  // 🔹 Normalize tags to the array format the backend expects
  let tagsArray: string[];

  if (Array.isArray(task.tags)) {
    // already an array
    tagsArray = task.tags;
  } else if (typeof task.tags === 'string') {
    const trimmed = task.tags.trim();

    // if empty string => treat as "no tags" (same behaviour as createTask)
    tagsArray = trimmed.length === 0 ? [' '] : this.textToArray(trimmed);
  } else {
    // fallback: no tags
    tagsArray = [' '];
  }

  const payload = {
    column: task.status,
    title: task.text,
    description: task.description || '',
    tags: tagsArray,                 // ✅ always array, never plain string
    color: task.color || '#16a34a',
    users: task.assignedUserIds
  };

  await this.http
    .patch(`${environment.apiUrl}/service/${this.taskBoardId}/tasks/${task.id}`, payload)
    .toPromise();

await this.initializeKanbanDataSource();
this.recalculateServiceInfoFromLocal();
await this.checkServiceStatus();
await this.reloadTaskBoard();      // <===== ADD THIS


}


private async reloadTaskBoard() {
  const updated = await this.http
    .get<TaskBoard>(`${environment.apiUrl}/tasks/task-board/${this.taskBoardId}`)
    .toPromise();

  this.taskBoard = updated || null;
}


  confirmDelete() {
    if (!this.editModel.id || !(this.isChief || this.isAdmin)) return;
    this.deleteTask(this.editModel.id);
    this.closeEditModal();
  }

async deleteTask(taskId: number): Promise<void> {
  await this.http
    .delete(`${environment.apiUrl}/service/${this.taskBoardId}/tasks/${taskId}`)
    .toPromise();

  this.data = this.data.filter(task => Number(task.id) !== Number(taskId));
  this.dataAdapter.localData = this.data;

  await this.initializeKanbanDataSource();
this.recalculateServiceInfoFromLocal();
await this.checkServiceStatus();

}


  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;

    if (!target.closest('.dropdown-select') && !target.closest('.dropdown-list')) {
      this.dropdownOpenCreate = false;
      this.dropdownOpenEdit = false;
    }
  }

  toggleDropdown(mode: 'create' | 'edit') {
    if (mode === 'create') {
      this.dropdownOpenCreate = !this.dropdownOpenCreate;
      this.dropdownOpenEdit = false;
    } else {
      this.dropdownOpenEdit = !this.dropdownOpenEdit;
      this.dropdownOpenCreate = false;
    }
  }

  toggleUserSelection(userId: number, mode: 'create' | 'edit') {
    const model = mode === 'create' ? this.createModel : this.editModel;

    const index = model.assignedUserIds.indexOf(userId);
    if (index === -1) model.assignedUserIds.push(userId);
    else model.assignedUserIds.splice(index, 1);
  }

  removeUser(userId: number, mode: 'create' | 'edit') {
    const model = mode === 'create' ? this.createModel : this.editModel;
    model.assignedUserIds = model.assignedUserIds.filter(id => id !== userId);
  }

  getSelectedNames(ids: number[]): string {
    return this.users
      .filter(u => ids.includes(u.id))
      .map(u => `${u.first_name} ${u.last_name}`)
      .join(', ');
  }

  getUserNameById(id: number): string {
    const user = this.users.find(u => u.id === id);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown';
  }

  kanbanItemRenderer = (element: any, item: any) => {
    const tags = (item.tags || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0);

    const priority =
      item.color === '#dc2626'
        ? 'high'
        : item.color === '#eab308'
        ? 'medium'
        : 'low';

    element.innerHTML = `
      <div class="kanban-card">
        <div class="k-card-top">
          <span class="k-card-title">${item.text}</span>
          <span class="k-priority ${priority}">${priority}</span>
        </div>

        <div class="k-card-desc">${item.description || ''}</div>

        <div class="k-tags">
          ${tags.map((t: string) => `<span class="k-tag">${t}</span>`).join('')
}
        </div>
      </div>
    `;
  };

  goBack() {
    this.location.back();
  }

  selectSection(isTaskboard: boolean) {
    this.isTaskboardSelected = isTaskboard;
    this.initializeKanbanDataSource();
  }

  toggleEdit() {
    if (!this.taskBoard?.service) return;

    this.router.navigate([
      `/projects/${this.taskBoard.service.project.projectID}/services/${this.taskBoard.service.serviceID}/edit`
    ]);
  }
  // ============ MISSING FUNCTIONS (REQUIRED BY HTML) ============
formatDecimal(num: number): string {
  if (num === null || num === undefined) return '0';
  return Number(num).toFixed(1).replace(/\.0$/, '');
}

openCreateModal() {
  this.createModel = {
    title: '',
    description: '',
    tags: '',
    priority: 'low',
    color: '#16a34a',
    assignedUserIds: []
  };
  this.showCreateModal = true;
}

closeCreateModal() {
  this.showCreateModal = false;
}
private recalculateServiceInfoFromLocal() {
  this.servicesInfo.backloggedTasks = this.data.filter(t => t.status === 'new').length;
  this.servicesInfo.activeTasks     = this.data.filter(t => t.status === 'work').length;
  this.servicesInfo.completedTasks  = this.data.filter(t => t.status === 'done').length;

  const total = this.data.length;

  this.servicesInfo.completionRate =
    total > 0 ? (this.servicesInfo.completedTasks / total) * 100 : 0;

  // 🔥 FIX PROGRESS BAR (UI reads from taskBoard.service)
  if (this.taskBoard?.service) {
    this.taskBoard.service.completionRate = this.servicesInfo.completionRate;
  }
}



}

