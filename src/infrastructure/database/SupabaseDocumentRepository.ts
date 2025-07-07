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
    const { data, error } = await this.supabase
      .from("document")
      .select(
        `
        id,
        expiration_date,
        category,
        document_type_id,
        type_document(name)
      `
      )
      .gte("expiration_date", startDate.toISOString().split("T")[0])
      .lte("expiration_date", endDate.toISOString().split("T")[0])
      .order("expiration_date", { ascending: true });

    if (error) {
      console.error("Error fetching expiring documents:", error);
      throw new Error(error.message);
    }

    return (
      data?.map(
        (doc) =>
          new Document(
            doc.id,
            new Date(doc.expiration_date),
            doc.category,
            doc.document_type_id,
            doc.type_document?.name
          )
      ) || []
    );
  }
}
