import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { TrainingPlan } from './training-plan.entity';
import { User } from './user.entity';
import { AthleteGroup } from './athlete-group.entity';
import { LoadRecord } from './load-record.entity';
import { Attendance } from './attendance.entity';

export enum TrainingType {
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
  AGILITY = 'agility',
  RECOVERY = 'recovery',
  TECHNIQUE = 'technique',
  MATCH = 'match',
  TEST = 'test',
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('training_sessions')
export class TrainingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TrainingType,
  })
  type: TrainingType;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ nullable: true })
  location: string;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED,
  })
  status: SessionStatus;

  @Column({ type: 'float', nullable: true })
  plannedDuration: number;

  @Column({ type: 'float', nullable: true })
  intensityLevel: number;

  @ManyToOne(() => TrainingPlan, (plan) => plan.sessions, { onDelete: 'CASCADE' })
  plan: TrainingPlan;

  @Column()
  planId: string;

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({ name: 'session_coaches' })
  coaches: User[];

  @ManyToMany(() => AthleteGroup, { cascade: true })
  @JoinTable({ name: 'session_groups' })
  targetGroups: AthleteGroup[];

  @ManyToMany(() => User, { cascade: true })
  @JoinTable({ name: 'session_athletes' })
  targetAthletes: User[];

  @OneToMany(() => LoadRecord, (record) => record.session)
  loadRecords: LoadRecord[];

  @OneToMany(() => Attendance, (attendance) => attendance.session)
  attendances: Attendance[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
