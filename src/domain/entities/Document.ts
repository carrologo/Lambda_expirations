export class Document {
  constructor(
    public id: number,
    public expiration_date: Date,
    public category: string,
    public document_type_id: number,
    public type_name?: string
  ) {}
}
