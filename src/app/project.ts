import { Service } from "./service";
import { User } from "./user";

export interface Project 
{
    projectID: number,
    name: string,
    services: Service[]
    description?: string;
    status?: string;
    progress: number;

    members: number;
    deadline: string;
}
