import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { Customer } from "./customer.model";
import { Profession } from "./professions.model";
import { Master } from "./master.model";

interface ISelectedServiceCreationAttr {
  customerId: number;
  professionId: number;
  time: string;
  date: string;
  masterId: number;
  last_state: string;
}

@Table({ tableName: "selected_services" })
export class SelectedServices extends Model<ISelectedServiceCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;


  @ForeignKey(() => Customer)
  @Column({
    type: DataType.INTEGER,
  })
  customerId: number;

  @BelongsTo(() => Customer)
  customer: Customer;

  @ForeignKey(() => Master)
  @Column({
    type: DataType.INTEGER,
  })
  masterId: number;

  @BelongsTo(() => Master)
  master: Master;

  @ForeignKey(() => Profession)
  @Column({
    type: DataType.INTEGER,
  })
  professionId: number;

  @BelongsTo(() => Profession)
  profession: Profession;

  @Column({
    type: DataType.STRING,
  })
  time: string;

  @Column({
    type: DataType.STRING,
  })
  date: string;

  @Column({
    type: DataType.STRING,
  })
  last_state: string;
}
