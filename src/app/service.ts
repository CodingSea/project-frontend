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
    status?: 'Pending Approval' | 'In-Progress' | 'Completed' | 'At Risk' | 'Overdue';
    chief: User;
    projectManager?: User;
    assignedResources: User[];
    backup: User[];
    taskBoard?: TaskBoard;
    memberCount?: number;
    completionRate?: number;
}