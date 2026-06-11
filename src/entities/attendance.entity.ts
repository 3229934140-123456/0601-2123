import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { TrainingSession } from './training-session.entity';
import { User } from './user.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
  NOT_RECORDED = 'not_recorded',
}

@Entity('attendances')
@Unique(['sessionId', 'athleteId'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TrainingSession, (session) => session.attendances, { onDelete: 'CASCADE' })
  session: TrainingSession;

  @Column()
  sessionId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  athlete: User;

  @Column()
  athleteId: string;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.NOT_RECORDED,
  })
  status: AttendanceStatus;

  @Column({ type: 'timestamp', nullable: true })
  checkInTime: Date;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
