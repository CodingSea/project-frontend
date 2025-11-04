// categories.ts
export enum Categories
{
    AllCategories = "All Categories",
    BugReport = "Bug Report",
    FeatureRequest = "Feature Request",
    SecurityIssue = "Security Issue",
    Database = "Database",
    Service = "Service",
}

export const CategoryClasses: { [ key in Categories ]: string } = {
    [ Categories.AllCategories ]: "tag", // Default class
    [ Categories.BugReport ]: "tag red",
    [ Categories.FeatureRequest ]: "tag green",
    [ Categories.SecurityIssue ]: "tag blue",
    [ Categories.Database ]: "tag yellow",
    [ Categories.Service ]: "tag green",
};