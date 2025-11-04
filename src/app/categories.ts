// categories.ts
export enum Categories {
  All = "All",
  BugReport = "Bug Report",
  FeatureRequest = "Feature Request",
  SecurityIssue = "Security Issue",
  Database = "Database"
}

// UI classes
export const CategoryClasses = {
  [Categories.All]: "tag category-all",
  [Categories.BugReport]: "tag category-bug",
  [Categories.FeatureRequest]: "tag category-feature",
  [Categories.SecurityIssue]: "tag category-security",
  [Categories.Database]: "tag category-database"
};

