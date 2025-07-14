import { createClient } from "@supabase/supabase-js";
import { Document } from "../../domain/entities/Document";
import { DocumentRepository } from "../../domain/repositories/DocumentRepository";

export class SupabaseDocumentRepository implements DocumentRepository {
  private supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_KEY || ""
  );

  async findExpiringInPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Document[]> {
    const { data, error } = await this.supabase.from("vehicle_document").select(
      `
        document_id,
        vehicle_id,
        document!VehicleDocument_document_id_fkey(
          id,
          expiration_date,
          category,
          document_type_id,
          type_document(name)
        ),
        vehicle!VehicleDocument_vehicle_id_fkey(
          id,
          plate
        )
      `
    );

    if (error) {
      console.error("Error fetching expiring documents:", error);
      throw new Error(error.message);
    }

    console.log(
      "Raw data from vehicle_document query:",
      JSON.stringify(data, null, 2)
    );

    const documentsWithVehicleInfo = await Promise.all(
      (data || []).map(async (vehicleDoc: any) => {
        console.log("Processing vehicleDoc:", vehicleDoc);

        // Validar que existan los datos necesarios
        if (!vehicleDoc.document) {
          console.warn(
            "Documento no encontrado para vehicle_document:",
            vehicleDoc
          );
          return null;
        }

   
        if (!vehicleDoc.document.id) {
          console.warn("Documento sin ID encontrado:", vehicleDoc.document);
          return null;
        }

        const docExpirationDate = new Date(vehicleDoc.document.expiration_date);
        if (docExpirationDate < startDate || docExpirationDate > endDate) {
          console.log(
            `Documento ${vehicleDoc.document.id} filtrado por fecha: ${
              vehicleDoc.document.expiration_date
            } no está entre ${startDate.toISOString().split("T")[0]} y ${
              endDate.toISOString().split("T")[0]
            }`
          );
          return null;
        }

        let buyerInfo: {
          id: number;
          name: string;
          identification: string;
        } | null = null;

        const doc = vehicleDoc.document;
        const vehicle = vehicleDoc.vehicle;
        const vehicleId = vehicleDoc.vehicle_id;

        // Buscar la transacción activa (más reciente) para este vehículo
        if (vehicleId) {
          try {
            const { data: transactionData } = await this.supabase
              .from("transaction")
              .select(
                `
                id_buyer,
                client!transaction_id_buyer_fkey(
                  id,
                  name,
                  last_name,
                  identification
                )
              `
              )
              .eq("id_vehicle", vehicleId)
              .order("start_date", { ascending: false })
              .limit(1);

            if (transactionData && transactionData.length > 0) {
              const transaction = transactionData[0] as any;
              if (transaction.client) {
                buyerInfo = {
                  id: transaction.client.id,
                  name: `${transaction.client.name} ${transaction.client.last_name}`.trim(),
                  identification: transaction.client.identification,
                };
              }
            }
          } catch (error) {
            console.error(
              "Error fetching transaction for vehicle:",
              vehicleId,
              error
            );
          }
        }

        console.log("Returning document:", {
          id: doc.id,
          vehicleId,
          plate: vehicle?.plate,
          hasBuyer: !!buyerInfo,
        });

        return new Document(
          doc.id,
          new Date(doc.expiration_date),
          doc.category,
          doc.document_type_id,
          doc.type_document?.name,
          vehicleId,
          vehicle?.plate,
          buyerInfo?.id,
          buyerInfo?.name,
          buyerInfo?.identification
        );
      })
    );

    console.log("Total documents processed:", documentsWithVehicleInfo.length);
    console.log(
      "Documents after filtering nulls:",
      documentsWithVehicleInfo.filter((doc) => doc !== null).length
    );

    // Filtrar documentos nulos y ordenar por fecha de expiración
    return documentsWithVehicleInfo
      .filter((doc): doc is Document => doc !== null)
      .sort(
        (a, b) => a.expiration_date.getTime() - b.expiration_date.getTime()
      );
  }
}
