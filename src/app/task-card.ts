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
}
