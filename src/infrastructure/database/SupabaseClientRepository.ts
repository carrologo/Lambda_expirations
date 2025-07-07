import { createClient } from "@supabase/supabase-js";
import { Client } from "../../domain/entities/Client";
import { ClientRepository } from "../../domain/repositories/ClientRepository";

export class SupabaseClientRepository implements ClientRepository {
  private supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_KEY || ""
  );

  async findBirthdaysInPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Client[]> {
    // Para cumpleaños, necesitamos buscar por mes y día, ignorando el año
    const startMonth = startDate.getMonth() + 1; // getMonth() devuelve 0-11
    const startDay = startDate.getDate();
    const endMonth = endDate.getMonth() + 1;
    const endDay = endDate.getDate();

    try {
      // Obtener todos los clientes activos
      const { data: allClients, error } = await this.supabase
        .from("client")
        .select("*")
        .eq("isActive", true);

      if (error) {
        console.error("Error fetching clients:", error);
        throw new Error(error.message);
      }

      // Filtrar por cumpleaños en el período especificado
      const filteredClients = (allClients || []).filter((client) => {
        const birthDate = new Date(client.birth_date);
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();

        if (startMonth === endMonth) {
          // Mismo mes
          return (
            birthMonth === startMonth &&
            birthDay >= startDay &&
            birthDay <= endDay
          );
        } else {
          // Cruza meses (ej: del 30 de junio al 6 de julio)
          return (
            (birthMonth === startMonth && birthDay >= startDay) ||
            (birthMonth === endMonth && birthDay <= endDay)
          );
        }
      });

      return filteredClients.map(
        (client) =>
          new Client(
            client.id,
            client.identification,
            client.name,
            client.email,
            new Date(client.birth_date),
            client.contact,
            client.isActive,
            client.comment,
            client.last_name
          )
      );
    } catch (error) {
      console.error("Error fetching clients with birthdays:", error);
      throw new Error(error instanceof Error ? error.message : "Unknown error");
    }
  }
}
