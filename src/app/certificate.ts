import { User } from "./user";

export interface Certificate
{
    name: string;
    type: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate: string;
    description?: string;
    userId?: User;
    createdAt?: Date;
    // certificateFile: File | null;
}