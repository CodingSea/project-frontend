import { Categories } from "./categories";
import { Feedback } from "./feedback";
import { Status } from "./status";
import { User } from "./user";

export interface Issue {
    id: number;
    title: string;
    description: string;
    status: Status;
    category: Categories;
    createdBy: User;
    createdAt: Date;
    updatedAt: Date;
    feedbacks: Feedback[];

    previewDescription?: string;
}

