export interface TaskCard
{
  id: number;
  title: string;
  column: string;
  description?: string;
  tags?: string[] | string;
  order?: number;
  color?: string;

  // ✅ Add these two lines:
  assignedUserId?: number | null;
  assignedUser?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;

  users?: number[];
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
}

export interface DeveloperTask
{
  userId: number;
  taskId: number;
  title: string;
}