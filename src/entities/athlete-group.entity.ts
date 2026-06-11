import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Team } from './team.entity';
import { User } from './user.entity';

@Entity('athlete_groups')
export class AthleteGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Team, (team) => team.groups, { onDelete: 'CASCADE' })
  team: Team;

  @Column()
  teamId: string;

  @ManyToMany(() => User)
  @JoinTable({ name: 'group_athletes' })
  athletes: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
