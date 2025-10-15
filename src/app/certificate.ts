export interface Certificate
{
    name: string;
    type: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate: string;
    description?: string;
    // certificateFile: File | null;
}