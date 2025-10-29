import { Issue } from "./issue";

export interface Feedback
{
    id: number;
    issue: Issue;
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}