import { Client } from "../entities/Client";

export interface ClientRepository {
  findBirthdaysInPeriod(startDate: Date, endDate: Date): Promise<Client[]>;
}
