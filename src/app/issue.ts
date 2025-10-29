import { Feedback } from "./feedback";
import { User } from "./user";

export interface Issue
{
    id: number;
    title: string;
    description: string;
    status: string;
    categories: string;
    createdBy: User; // Assuming User is also an interface
    createdAt: Date;
    updatedAt: Date;
    feedbacks: Feedback[]; // Assuming Feedback is also an interface
}