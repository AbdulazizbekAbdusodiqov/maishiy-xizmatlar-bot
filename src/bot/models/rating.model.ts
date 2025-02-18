import { Column, DataType, Model, Table } from "sequelize-typescript";

interface IRatingCreationAttr {
  user_id: number;
  master_id: number;
  rating_number: number;
}

@Table({ tableName: "rating" })
export class Rating extends Model<Rating, IRatingCreationAttr> {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.BIGINT,
    unique: true,
  })
  user_id: number;

  @Column({
    type: DataType.INTEGER,
    unique: true,
  })
  master_id: number;
  
  @Column({
    type: DataType.INTEGER,
  })
  rating_number: number;
}
