import { Certificate } from "./certificate";
import { Service } from "./service";
import { TaskBoard } from "./task-board";
import { DeveloperTask, TaskCard } from "./task-card";

export interface User 
{
    id: number
    first_name: string
    last_name: string
    email: string
    password: string
    role: string
    profileImage: string
    profileImageID: string
    skills: string[]
    certificates: Certificate[]
}

export interface DeveloperCard 
{
    id: number
    first_name: string
    last_name: string
    skills: string[]
    certificates?: Certificate[]
    services?: Service[]
    profileImage?: string;
    cards?: TaskCard[];
}