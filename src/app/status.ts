export enum Status
{
  All = "all",
  Open = "open",
  Resolved = "resolved",
}

export const StatusClasses = {
  [ Status.All ]: "tag status-all",
  [ Status.Open ]: "tag category-bug",
  [ Status.Resolved ]: "tag status-resolved",
};
