import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { AthleteGroup } from './athlete-group.entity';
import { TrainingPlan } from './training-plan.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  sportType: string;

  @ManyToMany(() => User, (user) => user.coachedTeams, { cascade: true })
  @JoinTable({ name: 'team_coaches' })
  coaches: User[];

  @ManyToMany(() => User, (user) => user.teams, { cascade: true })
  @JoinTable({ name: 'team_athletes' })
  athletes: User[];

  @OneToMany(() => AthleteGroup, (group) => group.team)
  groups: AthleteGroup[];

  @OneToMany(() => TrainingPlan, (plan) => plan.team)
  trainingPlans: TrainingPlan[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
