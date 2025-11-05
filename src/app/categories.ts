// categories.ts
export enum Categories {
  AllCategories = "all",
  BugReport = "Bug Report",
  FeatureRequest = "Feature Request",
  SecurityIssue = "Security Issue",
  Database = "Database",
  Service = "Service",
}

export const CategoryClasses: { [key in Categories]: string } = {
  [Categories.AllCategories]: "tag category-all",
  [Categories.BugReport]: "tag category-bug",
  [Categories.FeatureRequest]: "tag category-feature",
  [Categories.SecurityIssue]: "tag category-security",
  [Categories.Database]: "tag category-database",
  [Categories.Service]: "tag category-feature",
};
