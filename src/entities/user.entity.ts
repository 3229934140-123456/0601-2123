import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Team } from './team.entity';
import { InjuryRecord } from './injury-record.entity';

export enum UserRole {
  COACH = 'coach',
  ATHLETE = 'athlete',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ATHLETE,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ type: 'date', nullable: true })
  birthday: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ type: 'float', nullable: true })
  height: number;

  @Column({ type: 'float', nullable: true })
  weight: number;

  @ManyToMany(() => Team, (team) => team.coaches)
  @JoinTable({ name: 'team_coaches' })
  coachedTeams: Team[];

  @ManyToMany(() => Team, (team) => team.athletes)
  teams: Team[];

  @OneToMany(() => InjuryRecord, (injury) => injury.athlete)
  injuries: InjuryRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
