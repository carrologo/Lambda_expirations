import { Client } from "../../domain/entities/Client";
import { ClientRepository } from "../../domain/repositories/ClientRepository";

export class CreateClient {
  constructor(private clientRepository: ClientRepository) {}

  async execute(
    identification: string,
    name: string,
    email: string,
    birthDate: Date,
    contact: string,
    lastName: string,
    comment?: string
  ): Promise<Client> {
    try {
      const client = new Client(
        undefined, // id será generado por la base de datos
        identification,
        name,
        email,
        birthDate,
        contact,
        true, // isActive por defecto
        comment,
        lastName
      );

      return await this.clientRepository.save(client);
    } catch (error) {
      throw new Error(
        `Failed to create client: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
