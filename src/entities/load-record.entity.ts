import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { TrainingSession } from './training-session.entity';
import { User } from './user.entity';
import { Exercise } from './exercise.entity';

@Entity('load_records')
export class LoadRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TrainingSession, (session) => session.loadRecords, { onDelete: 'CASCADE' })
  session: TrainingSession;

  @Column()
  sessionId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  athlete: User;

  @Column()
  athleteId: string;

  @ManyToOne(() => Exercise, { onDelete: 'SET NULL', nullable: true })
  exercise: Exercise;

  @Column({ nullable: true })
  exerciseId: string;

  @Column({ nullable: true })
  exerciseName: string;

  @Column({ type: 'int', nullable: true })
  sets: number;

  @Column({ type: 'simple-array', nullable: true })
  reps: number[];

  @Column({ type: 'simple-array', nullable: true })
  weights: number[];

  @Column({ type: 'float', nullable: true })
  avgHeartRate: number;

  @Column({ type: 'float', nullable: true })
  maxHeartRate: number;

  @Column({ type: 'int', nullable: true })
  rpe: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'float', nullable: true })
  durationMinutes: number;

  @Column({ type: 'float', nullable: true })
  distanceKm: number;

  @Column({ type: 'float', nullable: true })
  totalLoad: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
