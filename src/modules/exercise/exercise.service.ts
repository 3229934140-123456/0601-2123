import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Exercise, ExerciseCategory, EquipmentType } from '../../entities/exercise.entity';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Exercise)
    private exerciseRepository: Repository<Exercise>,
  ) {}

  async create(exerciseData: Partial<Exercise>): Promise<Exercise> {
    const exercise = this.exerciseRepository.create(exerciseData);
    return this.exerciseRepository.save(exercise);
  }

  async findAll(
    category?: ExerciseCategory,
    equipment?: EquipmentType,
    keyword?: string,
  ): Promise<Exercise[]> {
    const where: any = {};

    if (category) {
      where.category = category;
    }
    if (equipment) {
      where.equipment = equipment;
    }
    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }

    return this.exerciseRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Exercise> {
    const exercise = await this.exerciseRepository.findOne({ where: { id } });
    if (!exercise) {
      throw new NotFoundException('动作不存在');
    }
    return exercise;
  }

  async update(id: string, exerciseData: Partial<Exercise>): Promise<Exercise> {
    const exercise = await this.findById(id);
    Object.assign(exercise, exerciseData);
    return this.exerciseRepository.save(exercise);
  }

  async delete(id: string): Promise<void> {
    const result = await this.exerciseRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('动作不存在');
    }
  }

  async getCategories(): Promise<string[]> {
    return Object.values(ExerciseCategory);
  }

  async getEquipmentTypes(): Promise<string[]> {
    return Object.values(EquipmentType);
  }
}
