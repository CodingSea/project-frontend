import { User } from "./user";

export interface TaskCard
{
    id?: number;
    column: string;
    title: string;
    description?: string;
    taskBoardId?: number;
    comments?: Comment[];
    tags?: string[];
    order: number;
    color?: string;
    assignee?: User | null;
    assigneeId?: number | null;
}

export interface TaskCardDisplayed
{
    id?: number;
    column: string;
    title: string;
    description?: string;
    taskBoardId?: number;
    comments?: Comment[];
    tags?: string;
    order: number;
    color?: string;
    assignee?: User;
}
