// categories.ts
export enum Status
{
    All = "All Status",
    Open = "Open",
    Resolved = "Resolved",
}

export const StatusClasses: { [ key in Status ]: string } =
{
    [ Status.All ]: "tag red",
    [ Status.Open ]: "tag red",
    [ Status.Resolved ]: "tag blue",
};