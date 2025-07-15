import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { ClientRepository } from "../../domain/repositories/ClientRepository";
import { DocumentRepository } from "../../domain/repositories/DocumentRepository";
import {
  PeriodType,
  ExpirationResult,
} from "../../domain/entities/ExpirationResult";

export class GetExpirations {
  constructor(
    private clientRepository: ClientRepository,
    private documentRepository: DocumentRepository
  ) {}

  async execute(
    periodType: PeriodType,
    referenceDate?: Date
  ): Promise<ExpirationResult> {
    const refDate = referenceDate || new Date();
    let startDate: Date;
    let endDate: Date;
    let periodDescription: string;

    switch (periodType) {
      case PeriodType.WEEK:
        startDate = startOfWeek(refDate, { weekStartsOn: 1 }); // Lunes como inicio de semana
        endDate = endOfWeek(refDate, { weekStartsOn: 1 });
        periodDescription = `Semana del ${format(startDate, "dd/MM/yyyy", {
          locale: es,
        })} al ${format(endDate, "dd/MM/yyyy", { locale: es })}`;
        break;
      case PeriodType.MONTH:
        startDate = startOfMonth(refDate);
        endDate = endOfMonth(refDate);
        periodDescription = format(refDate, "MMMM yyyy", { locale: es });
        break;
      default:
        throw new Error("Tipo de período no válido");
    }

    try {
      const [upcomingBirthdays, expiringDocuments] = await Promise.all([
        this.clientRepository.findBirthdaysInPeriod(startDate, endDate),
        this.documentRepository.findExpiringInPeriod(startDate, endDate),
      ]);

      return {
        upcomingBirthdays: upcomingBirthdays.map((client) => ({
          id: client.id,
          name: `${client.name} ${client.last_name}`.trim(),
          email: client.email,
          birthDate: client.birth_date,
          contact: client.contact,
          identification: client.identification,
        })),
        expiringDocuments: expiringDocuments.map((doc) => ({
          id: doc.id,
          category: doc.category,
          expirationDate: doc.expiration_date,
          documentType: doc.type_name,
          documentTypeId: doc.document_type_id,
          vehicle: doc.vehicle_id
            ? {
                id: doc.vehicle_id,
                plate: doc.vehicle_plate,
              }
            : null,
          buyer: doc.buyer_id
            ? {
                id: doc.buyer_id,
                name: doc.buyer_name,
                identification: doc.buyer_identification,
                contact: doc.buyer_contact,
              }
            : null,
        })),
        period: periodDescription,
        periodType,
      };
    } catch (error) {
      throw new Error(
        `Failed to get expirations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
