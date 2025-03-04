import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Profession } from "./professions.model";

interface IMasterCreationAttr {
  user_id: number | undefined;
  profession_id: number | undefined;
  name: string | undefined;
  phone_number: string | undefined;
  workshop_name: string | undefined;
  address: string | undefined;
  location: string | undefined;
  start_work_time: string | undefined;
  end_work_time: string | undefined;
  one_working_time: number | undefined;
  rating:number | undefined;
  last_state: string;
}

@Table({ tableName: "master" })
export class Master extends Model<Master, IMasterCreationAttr> {
 
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement:true   
  })
  id: number;

  @ForeignKey(()=>Profession)
  @Column({
    type: DataType.INTEGER,
  })
  profession_id: number | undefined;

  @BelongsTo(()=>Profession)
  profession : Profession

  @Column({
    type: DataType.BIGINT,
  })
  user_id: number | undefined;

  @Column({
    type: DataType.STRING,
    allowNull:false
  })
  name: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  phone_number: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  workshop_name: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  address: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  location: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  start_work_time: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  end_work_time: string | undefined;
  @Column({
    type: DataType.STRING,
  })
  one_working_time: number | undefined;
  @Column({
    type: DataType.BOOLEAN,
    defaultValue:false
  })
  is_confirmed: boolean | undefined;

  @Column({
    type:DataType.INTEGER
  })
  rating:number;

  @Column({
    type: DataType.STRING,
  })
  last_state: string;

}
