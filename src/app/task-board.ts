import { Service } from "./service";
import { TaskCard } from "./task-card";

export interface TaskBoard
{
    id: number;
    service: Service;
    cards: TaskCard[];
}
