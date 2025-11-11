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

  // only assigned users for this service
  users: User[] = [];

  // Role flags
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

  // Dropdown flags
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
    private userService: UserService // still injected if you need it elsewhere
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

      if (!token) {
        console.warn('No JWT token found in localStorage');
        return null;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT token format');
        return null;
      }

      const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload: any = JSON.parse(payloadJson);

      const user: User = {
        id: Number(payload.id || payload.userId || payload.sub),
        first_name: payload.first_name || payload.firstName || '',
        last_name: payload.last_name || payload.lastName || '',
        email: payload.email || '',
        role: payload.role || payload.userType || '',
        skills: []
      };

      if (!user.id) {
        console.warn('JWT payload did not contain a valid user id');
        return null;
      }

      return user;
    } catch (e) {
      console.error('Failed to decode JWT token', e);
      return null;
    }
  }

  async loadCurrentUserAndRoles(): Promise<void> {
    try {
      this.currentUser = this.getUserFromToken();
      console.log('🟢 currentUser from JWT:', this.currentUser);

      if (!this.currentUser) {
        this.isAdmin = this.isChief = this.isManager = this.isResource = false;
        return;
      }

      const service = await this.http
        .get<Service>(`${environment.apiUrl}/service/${this.serviceId}`)
        .toPromise();

      console.log('🟣 full service object:', service);

      if (!service) {
        this.isAdmin = this.isChief = this.isManager = this.isResource = false;
        return;
      }

      const userId = Number(this.currentUser.id);
      const role = (this.currentUser.role || '').toLowerCase();

      this.isAdmin = role === 'admin';

      this.isChief = !!service.chief && Number(service.chief.id) === userId;

      this.isManager =
        !!service.projectManager && Number(service.projectManager.id) === userId;

      this.isResource =
        Array.isArray(service.assignedResources) &&
        service.assignedResources.some((r: any) => Number(r.id) === userId);

      console.log('Role flags:', {
        isAdmin: this.isAdmin,
        isChief: this.isChief,
        isManager: this.isManager,
        isResource: this.isResource
      });
    } catch (err) {
      console.error('❌ loadCurrentUserAndRoles error:', err);
      this.isAdmin = this.isChief = this.isManager = this.isResource = false;
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
      case '#dc2626':
        return 'high';
      case '#eab308':
        return 'medium';
      default:
        return 'low';
    }
  }

  textToArray(text: string | string[]): string[] {
    if (Array.isArray(text)) return text;
    if (typeof text !== 'string') return [' '];
    return text
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
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

      if ((service as any).chief) assigned.push((service as any).chief);
      if ((service as any).projectManager) assigned.push((service as any).projectManager);
      if (Array.isArray((service as any).assignedResources)) {
        assigned.push(...(service as any).assignedResources);
      }
      if (Array.isArray((service as any).backup)) {
        assigned.push(...(service as any).backup);
      }

      const uniqueUsers = new Map<number, User>();
      assigned.forEach(u => {
        if (u && u.id) uniqueUsers.set(u.id, u);
      });

      this.users = Array.from(uniqueUsers.values());
    } catch (err) {
      console.error('Error loading assigned users:', err);
      this.users = [];
    }
  }

  // ==================== SERVICE INFO / PROGRESS ====================

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
        if (!this.taskBoard) return;

        const service: any = this.taskBoard.service;
        if (!service) return;

        this.servicesInfo.totalServices = 1;

        const uniqueMembers = new Set<number>();
        if (service.chief) uniqueMembers.add(service.chief.id);
        if (service.projectManager) uniqueMembers.add(service.projectManager.id);
        service.assignedResources?.forEach((r: any) => uniqueMembers.add(r.id));
        service.backup?.forEach((b: any) => uniqueMembers.add(b.id));

        this.servicesInfo.totalMembers = uniqueMembers.size;

        let total = 0;
        this.servicesInfo.backloggedTasks = 0;
        this.servicesInfo.activeTasks = 0;
        this.servicesInfo.completedTasks = 0;

        this.taskBoard.cards?.forEach((t: any) => {
          total++;
          if (t.column === 'new') this.servicesInfo.backloggedTasks++;
          else if (t.column === 'work') this.servicesInfo.activeTasks++;
          else if (t.column === 'done') this.servicesInfo.completedTasks++;
        });

        this.servicesInfo.completionRate =
          total > 0 ? (this.servicesInfo.completedTasks / total) * 100 : 0;
      });
  }

  async checkServiceStatus() {
    try {
      if (
        !this.dataAdapter?.localData ||
        this.dataAdapter.localData.length === 0 ||
        this.dataAdapter.localData[0].status === 's'
      ) {
        await this.http
          .patch<Service>(`${environment.apiUrl}/service/${this.serviceId}/status`, {
            status: ServiceStatus.New
          })
          .toPromise();
        return;
      }

      if (this.taskBoard?.service.status == 'On Hold') return;

      if (this.servicesInfo.completionRate === 100) {
        if (this.taskBoard?.service.status === 'Pending Approval') return;

        await this.http
          .patch<Service>(`${environment.apiUrl}/service/${this.serviceId}/status`, {
            status: ServiceStatus.Completed
          })
          .toPromise();
      } else {
        await this.http
          .patch<Service>(`${environment.apiUrl}/service/${this.serviceId}/status`, {
            status: ServiceStatus.InProgress
          })
          .toPromise();
      }
    } catch (err) {
      console.error('Error checking service status:', err);
    }
  }

  // ==================== BOARD DATA (TASKS) ====================

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
            ? task.users.map(u => u.id)
            : task.assignedUserIds && task.assignedUserIds.length
            ? task.assignedUserIds
            : task.assignedUserId
            ? [Number(task.assignedUserId)]
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

    if (this.data.length === 0) {
      this.data = [
        {
          id: '1',
          status: 's',
          text: 'eee',
          tags: 'ss',
          description: 'ssssee',
          assignee: 'John sp',
          color: '#C21A25',
          assignedUserIds: []
        }
      ];
    }

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

    await this.rebuildKanban();
    await this.checkServiceStatus();
  }

  async rebuildKanban() {
    if (this.kanban) this.kanban.destroy();
    this.showKanban = false;

    await this.getBoardCards();

    setTimeout(() => {
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

      this.showKanban = true;

      setTimeout(() => {
        if (this.kanban && this.kanban.host) {
          (this.kanban as any).itemRenderer = this.kanbanItemRenderer;
        }
      }, 50);
    }, 0);
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

  closeCreateModal() {
    this.showCreateModal = false;
  }

  openEditModal(item: any) {
    if (!this.isChief && !this.isAdmin) return;

    const t = this.data.find(x => String(x.id) === String(item.id));
    if (!t) return;

    const priority = this.colorToPriority(t.color);
    const assignedUserIds: number[] = t.assignedUserIds && t.assignedUserIds.length
      ? t.assignedUserIds
      : [];

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

  closeEditModal() {
    this.showEditModal = false;
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
    await this.rebuildKanban();
    await this.getCurrentServiceInfo();
    await this.checkServiceStatus();
    this.closeEditModal();
  }

  confirmDelete() {
    if (!this.editModel?.id || !(this.isChief || this.isAdmin)) return;
    this.deleteTask(this.editModel.id);
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
    const newTaskOrder = this.data.filter(task => task.status === 'new').length;

    const newTask: any = {
      title: taskText,
      column,
      description,
      tags: formattedTags,
      order: newTaskOrder,
      color,
      users: assignedUserIds
    };

    try {
      const response = await this.http
        .post<TaskCard>(
          `${environment.apiUrl}/service/${this.taskBoardId}/cards`,
          newTask,
          { headers: { 'Content-Type': 'application/json' } }
        )
        .toPromise();

      const created = response!;
      this.data.push({
        id: String(created?.id),
        status: column,
        text: taskText,
        description,
        tags: formattedTags,
        order: newTaskOrder,
        color,
        assignedUserIds
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

    const payload: any = {
      column: task.status,
      title: task.text,
      description: task.description || '',
      tags: Array.isArray(task.tags)
        ? task.tags
        : this.textToArray(task.tags) || [],
      order: task.order,
      color: task.color || '#16a34a',
      users: task.assignedUserIds
    };

    try {
      await this.http
        .patch<TaskCard>(
          `${environment.apiUrl}/service/${this.taskBoardId}/tasks/${task.id}`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        )
        .toPromise();

      const idx = this.data.findIndex(x => String(x.id) === String(task.id));
      if (idx !== -1) {
        this.data[idx] = { ...this.data[idx], ...payload };
      }

      this.dataAdapter.localData = this.data;
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  async deleteTask(taskId: number): Promise<void> {
    try {
      await this.http
        .delete(`${environment.apiUrl}/service/${this.taskBoardId}/tasks/${taskId}`)
        .toPromise();

      this.data = this.data.filter(task => Number(task.id) !== Number(taskId));
      this.dataAdapter.localData = this.data;

      await this.rebuildKanban();
      await this.initializeKanbanDataSource();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
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

  // ==================== NAVIGATION ====================

  goBack() {
    this.location.back();
  }

  selectSection(isTaskboard: boolean) {
    this.isTaskboardSelected = isTaskboard;
    this.initializeKanbanDataSource();
  }

  toggleEdit() {
    this.router.navigate([
      `/projects/${this.taskBoard?.service.project.projectID}/services/${this.taskBoard?.service.serviceID}/edit`
    ]);
  }

  // ==================== KANBAN RENDERER ====================

  kanbanItemRenderer = (element: any, item: any) => {
    const tags = (item.tags || '').split(',').filter((x: string) => x.trim());
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
          ${tags
            .map((t: string) => `<span class="k-tag">${t.trim()}</span>`)
            .join('')}
        </div>
      </div>`;
  };

  // ==================== DROPDOWNS ====================

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (
      !target.closest('.dropdown-select') &&
      !target.closest('.dropdown-list')
    ) {
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
    return user
      ? `${user.first_name} ${user.last_name}`
      : 'Unknown';
  }
}
