import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IProfessionsCreationAttr {
  name: string;
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
    allowNull:false
  })
  name: string;
}
