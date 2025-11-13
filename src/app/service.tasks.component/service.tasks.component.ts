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
    private location: Location,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    window.scroll({ top: 0, left: 0 });

    this.route.params.subscribe(async params => {
      this.serviceId = params['serviceId'];
      this.taskBoardId = params['taskBoardId'];

      await this.loadCurrentUserAndRoles();
      await this.initializeKanbanDataSource();
      this.getCurrentServiceInfo();
      this.loadAssignedUsers();
    });
  }

  ngAfterViewInit() {}

  // ==================== AUTH / ROLES ====================

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
    } catch (e) {
      console.error('Failed to decode JWT token', e);
      return null;
    }
  }

  async loadCurrentUserAndRoles(): Promise<void> {
    try {
      this.currentUser = this.getUserFromToken();
      if (!this.currentUser) return;

      const service = await this.http
        .get<Service>(`${environment.apiUrl}/service/${this.serviceId}`)
        .toPromise();

      const userId = Number(this.currentUser.id);
      const role = (this.currentUser.role || '').toLowerCase();

      this.isAdmin = role === 'admin';
      this.isChief = !!service?.chief && Number(service.chief.id) === userId;
      this.isManager = !!service?.projectManager && Number(service.projectManager.id) === userId;
      this.isResource =
        Array.isArray(service?.assignedResources) &&
        service.assignedResources.some((r: any) => Number(r.id) === userId);
    } catch (err) {
      console.error('loadCurrentUserAndRoles error:', err);
    }
  }

  // ==================== HELPERS ====================

  updatePriorityColor(task: { priority: 'low' | 'medium' | 'high'; color: string }) {
    if (!task) return;
    if (task.priority === 'low') task.color = '#16a34a';
    if (task.priority === 'medium') task.color = '#eab308';
    if (task.priority === 'high') task.color = '#dc2626';
  }

  private colorToPriority(color?: string): 'low' | 'medium' | 'high' {
    switch ((color || '').toLowerCase()) {
      case '#dc2626': return 'high';
      case '#eab308': return 'medium';
      default: return 'low';
    }
  }

  textToArray(text: string | string[]): string[] {
    if (Array.isArray(text)) return text;
    if (typeof text !== 'string') return [' '];
    return text.split(',').map(t => t.trim()).filter(t => t.length > 0);
  }

  arrayToString(arr: string[] | string | undefined): string {
    if (!arr) return '';
    if (Array.isArray(arr)) return arr.join(', ');
    return arr;
  }

  formatDecimal(num: number): string {
    const r = Math.round(num * 10) / 10;
    const s = String(r);
    return s.endsWith('.0') ? s.slice(0, -2) : s;
  }

  // ==================== LOAD ASSIGNED USERS ====================

  async loadAssignedUsers(): Promise<void> {
    try {
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
      if (Array.isArray(service.assignedResources)) assigned.push(...service.assignedResources);
      if (Array.isArray(service.backup)) assigned.push(...service.backup);

      const uniqueUsers = new Map<number, User>();
      assigned.forEach(u => { if (u && u.id) uniqueUsers.set(u.id, u); });
      this.users = Array.from(uniqueUsers.values());
    } catch (err) {
      console.error('Error loading assigned users:', err);
      this.users = [];
    }
  }

  // ==================== SERVICE INFO ====================

  async getCurrentServiceInfo(): Promise<void> {
    this.servicesInfo = {
      totalServices: 0,
      backloggedTasks: 0,
      activeTasks: 0,
      completedTasks: 0,
      totalMembers: 0,
      completionRate: 0.0
    };

    this.http
      .get<TaskBoard>(`${environment.apiUrl}/tasks/task-board/${this.taskBoardId}`)
      .subscribe(res => {
        this.taskBoard = res;
        if (!res?.service) return;

        const service: any = res.service;
        const members = new Set<number>();
        if (service.chief) members.add(service.chief.id);
        if (service.projectManager) members.add(service.projectManager.id);
        service.assignedResources?.forEach((r: any) => members.add(r.id));
        service.backup?.forEach((b: any) => members.add(b.id));
        this.servicesInfo.totalMembers = members.size;

        let total = 0;
        this.servicesInfo.backloggedTasks = 0;
        this.servicesInfo.activeTasks = 0;
        this.servicesInfo.completedTasks = 0;

        res.cards?.forEach((t: any) => {
          total++;
          if (t.column === 'new') this.servicesInfo.backloggedTasks++;
          else if (t.column === 'work') this.servicesInfo.activeTasks++;
          else if (t.column === 'done') this.servicesInfo.completedTasks++;
        });

        this.servicesInfo.completionRate =
          total > 0 ? (this.servicesInfo.completedTasks / total) * 100 : 0;
      });
  }

  // ==================== BOARD DATA ====================

  async getBoardCards(): Promise<void> {
    try {
      const response = await this.http
        .get<TaskCard[]>(`${environment.apiUrl}/service/${this.serviceId}/tasks`)
        .toPromise();

      if (!response || response.length === 0) {
        this.data = [];
        return;
      }

      this.data = response.map(task => {
        const assignedUserIds =
          Array.isArray(task.users) && task.users.length
            ? task.users.map(u => (typeof u === 'object' ? u.id : u))
            : [];

        return {
          id: String(task.id),
          status: task.column,
          text: task.title,
          tags: this.arrayToString(task.tags as any),
          description: task.description || '',
          color: task.color || '#16a34a',
          assignedUserIds
        };
      });
    } catch (e) {
      console.error('Error fetching board cards:', e);
      this.data = [];
    }
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
        { name: 'assignee', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'assignedUserIds', type: 'array' }
      ]
    });
    this.dataAdapter.localData = this.data;
  }

  // ==================== DRAG & DROP ====================

  async onItemMoved(event: any): Promise<void> {
    const movedTask = event.args.itemData;
    if (!movedTask) return;

    const newStatus = event.args.newColumn.dataField;
    const t = this.data.find(task => String(task.id) === String(movedTask.id));

    if (t) {
      t.status = newStatus;
      await this.updateTaskOrder(newStatus);
      await this.updateTask(t);
      await this.getCurrentServiceInfo();
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

  // ==================== MODALS ====================

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

  closeCreateModal() { this.showCreateModal = false; }

  openEditModal(item: any) {
    if (!this.isChief && !this.isAdmin) return;
    const t = this.data.find(x => String(x.id) === String(item.id));
    if (!t) return;
    const priority = this.colorToPriority(t.color);
    const assignedUserIds: number[] = t.assignedUserIds && t.assignedUserIds.length
      ? t.assignedUserIds : [];
    this.editModel = {
      id: Number(t.id),
      title: t.text,
      description: t.description || '',
      tags: typeof t.tags === 'string' ? t.tags : this.arrayToString(t.tags),
      priority,
      color: t.color || '#16a34a',
      column: (t.status as 'new' | 'work' | 'done') || 'new',
      assignedUserIds
    };
    this.showEditModal = true;
  }

  closeEditModal() { this.showEditModal = false; }

  confirmDelete() {
    if (!this.editModel?.id || !(this.isChief || this.isAdmin)) return;
    this.deleteTask(this.editModel.id);
    this.closeEditModal();
  }

  // ==================== CREATE / UPDATE / DELETE ====================

  async submitCreateTask() {
    if (!(this.isChief || this.isManager || this.isResource || this.isAdmin)) return;
    this.updatePriorityColor(this.createModel);
    await this.createTask(
      this.createModel.title,
      'new',
      this.createModel.tags,
      this.createModel.description,
      this.createModel.color,
      this.createModel.assignedUserIds
    );
    this.closeCreateModal();
  }

  async submitEditTask() {
    if (!(this.isChief || this.isAdmin)) return;
    this.updatePriorityColor(this.editModel);
    const payload: any = {
      id: this.editModel.id,
      status: this.editModel.column,
      text: this.editModel.title,
      description: this.editModel.description,
      tags: this.editModel.tags,
      color: this.editModel.color,
      assignedUserIds: this.editModel.assignedUserIds || [],
      order: this.data.findIndex(d => Number(d.id) === this.editModel.id)
    };
    await this.updateTask(payload);
    await this.getCurrentServiceInfo();
    this.closeEditModal();
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


    await this.getCurrentServiceInfo();
  } catch (error) {
    console.error('Error creating task:', error);
  }
}


  async updateTask(task: any): Promise<void> {
    const payload = {
      column: task.status,
      title: task.text,
      description: task.description || '',
      tags: Array.isArray(task.tags) ? task.tags : this.textToArray(task.tags),
      color: task.color || '#16a34a',
      users: task.assignedUserIds
    };
    await this.http.patch(`${environment.apiUrl}/service/${this.taskBoardId}/tasks/${task.id}`, payload).toPromise();
  }

  async deleteTask(taskId: number): Promise<void> {
    await this.http.delete(`${environment.apiUrl}/service/${this.taskBoardId}/tasks/${taskId}`).toPromise();
    this.data = this.data.filter(task => Number(task.id) !== Number(taskId));
    this.dataAdapter.localData = this.data;
  }

  // ==================== DROPDOWNS ====================

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

  // ==================== NAVIGATION ====================

  goBack() { this.location.back(); }

  selectSection(isTaskboard: boolean) {
    this.isTaskboardSelected = isTaskboard;
    this.initializeKanbanDataSource();
  }

  toggleEdit() {
    this.router.navigate([
      `/projects/${this.taskBoard?.service.project.projectID}/services/${this.taskBoard?.service.serviceID}/edit`
    ]);
  }
}
