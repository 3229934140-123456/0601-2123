import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';
import { TrainingSession } from './training-session.entity';

export enum TestType {
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
  AGILITY = 'agility',
  POWER = 'power',
  FLEXIBILITY = 'flexibility',
  SPEED = 'speed',
  BODY_COMPOSITION = 'body_composition',
  OTHER = 'other',
}

@Entity('test_scores')
export class TestScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  athlete: User;

  @Column()
  athleteId: string;

  @ManyToOne(() => TrainingSession, { onDelete: 'SET NULL', nullable: true })
  session: TrainingSession;

  @Column({ nullable: true })
  sessionId: string;

  @Column({
    type: 'enum',
    enum: TestType,
  })
  testType: TestType;

  @Column()
  testName: string;

  @Column({ type: 'float' })
  value: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'date' })
  testDate: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
