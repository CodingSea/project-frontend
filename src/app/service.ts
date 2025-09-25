export interface Service 
{
    id: number,
    projectId: number,
    deadline: Date,
    status: string,
    chiefId: number,
    projectManagerId: number,
    assignedResources: number[],
    backup: number[]
}
