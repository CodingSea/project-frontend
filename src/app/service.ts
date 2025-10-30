import { User } from "./user";
import { Project } from "./project";
import { TaskBoard } from "./task-board";

export interface Service 
{
    serviceID: number;
    name: string;
    description: string;
    project: Project;
    deadline: Date;
    status?: 'Pending Approval' | 'In-Progress' | 'Completed' | 'At Risk' | 'Overdue' | "on Hold" | "Not Started Yet";
    chief: User;
    projectManager?: User;
    assignedResources: User[];
    backup: User[];
    taskBoard?: TaskBoard;
    memberCount?: number;
    completionRate?: number;
}

export enum ServiceStatus
{
  New = 'Not Started Yet',
  Pending = 'Pending Approval',
  InProgress = 'In-Progress',
  Completed = 'Completed',
  OnHold = "On Hold"
}