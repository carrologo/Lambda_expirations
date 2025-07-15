export class Document {
  constructor(
    public id: number,
    public expiration_date: Date,
    public category: string,
    public document_type_id: number,
    public type_name?: string,
    public vehicle_id?: number,
    public vehicle_plate?: string,
    public buyer_id?: number,
    public buyer_name?: string,
    public buyer_identification?: string,
    public buyer_contact?: string
  ) {}
}
