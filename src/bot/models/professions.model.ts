import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { SelectedServices } from "./selected_services.model";

interface IProfessionsCreationAttr {
  name: string | undefined;
  last_state: string ;
}

@Table({ tableName: "profession" })
export class Profession extends Model<Profession, IProfessionsCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  name: string;

  @Column({
    type: DataType.STRING,
  })
  last_state: string;
}
