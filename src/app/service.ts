import { User } from "./user";
import { Project } from "./project";

export interface Service 
{
    serviceID: number;
    name: string;
    project: Project;
    deadline: Date;
    status: 'pending' | 'in-progress' | 'completed';
    chief: User;
    projectManager?: User;
    assignedResources?: User[];
    backup?: User[];
}