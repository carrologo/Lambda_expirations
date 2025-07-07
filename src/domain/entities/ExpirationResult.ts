export enum PeriodType {
  WEEK = "week",
  MONTH = "month",
}

export interface ExpirationResult {
  upcomingBirthdays: any[];
  expiringDocuments: any[];
  period: string;
  periodType: PeriodType;
}
