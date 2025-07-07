import { Document } from "../entities/Document";

export interface DocumentRepository {
  findExpiringInPeriod(startDate: Date, endDate: Date): Promise<Document[]>;
}
