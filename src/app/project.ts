import { Service } from "./service";

export interface Project 
{
    id: number,
    name: string,
    services: Service[]
}
