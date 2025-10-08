import { TaskCard } from "./task-card";

export interface TaskBoard
{
    id: number;
    serviceId: number;
    cards: TaskCard[];
}
