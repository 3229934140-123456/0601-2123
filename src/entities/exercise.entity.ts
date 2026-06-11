import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ExerciseCategory {
  STRENGTH = 'strength',
  ENDURANCE = 'endurance',
  AGILITY = 'agility',
  FLEXIBILITY = 'flexibility',
  POWER = 'power',
  BALANCE = 'balance',
  RECOVERY = 'recovery',
}

export enum EquipmentType {
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  KETTLEBELL = 'kettlebell',
  MACHINE = 'machine',
  BODYWEIGHT = 'bodyweight',
  CABLE = 'cable',
  BAND = 'band',
  OTHER = 'other',
}

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ExerciseCategory,
  })
  category: ExerciseCategory;

  @Column({
    type: 'enum',
    enum: EquipmentType,
    nullable: true,
  })
  equipment: EquipmentType;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  targetMuscles: string[];

  @Column({ default: true })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
