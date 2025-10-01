export interface Certificate
{
    certificateName: string;
    certificateType: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate?: string;
    description?: string;
    // certificateFile: File | null;
}