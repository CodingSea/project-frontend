export enum Status {
  All = "All",
  Open = "Open",
  Resolved = "Resolved",
}

export const StatusClasses = {
  [Status.All]: "tag status-all",
  [Status.Open]: "tag status-open",
  [Status.Resolved]: "tag status-resolved"
};

