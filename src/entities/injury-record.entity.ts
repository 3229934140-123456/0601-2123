import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

export enum InjurySeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
}

export enum InjuryStatus {
  ACTIVE = 'active',
  RECOVERING = 'recovering',
  RECOVERED = 'recovered',
}

@Entity('injury_records')
export class InjuryRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.injuries, { onDelete: 'CASCADE' })
  athlete: User;

  @Column()
  athleteId: string;

  @Column()
  bodyPart: string;

  @Column()
  injuryType: string;

  @Column({
    type: 'enum',
    enum: InjurySeverity,
  })
  severity: InjurySeverity;

  @Column({
    type: 'enum',
    enum: InjuryStatus,
    default: InjuryStatus.ACTIVE,
  })
  status: InjuryStatus;

  @Column({ type: 'date' })
  injuryDate: Date;

  @Column({ type: 'date', nullable: true })
  expectedRecoveryDate: Date;

  @Column({ type: 'int', default: 100 })
  trainingLoadLimit: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  restrictedActivities: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
