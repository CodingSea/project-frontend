export enum Status {
  All = "all",
  Open = "open",
  InProgress = "in-progress",
  Resolved = "resolved",
}

export const StatusClasses = {
  [Status.All]: "tag status-all",
  [Status.Open]: "tag status-open",
  [Status.InProgress]: "tag status-progress",
  [Status.Resolved]: "tag status-resolved",
};
