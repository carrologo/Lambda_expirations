export class Client {
  constructor(
    public id?: number,
    public identification?: string,
    public name?: string,
    public email?: string,
    public birth_date?: Date,
    public contact?: string,
    public isActive?: boolean,
    public comment?: string,
    
    public last_name?: string
  ) {}
}
