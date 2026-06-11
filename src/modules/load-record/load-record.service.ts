import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as dayjs from 'dayjs';
import { LoadRecord } from '../../entities/load-record.entity';
import { TrainingSession } from '../../entities/training-session.entity';
import { User } from '../../entities/user.entity';
import { Exercise } from '../../entities/exercise.entity';

export interface ProgressPoint {
  date: string;
  value: number;
  exerciseId?: string;
  exerciseName?: string;
}

@Injectable()
export class LoadRecordService {
  constructor(
    @InjectRepository(LoadRecord)
    private loadRecordRepository: Repository<LoadRecord>,
    @InjectRepository(TrainingSession)
    private sessionRepository: Repository<TrainingSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Exercise)
    private exerciseRepository: Repository<Exercise>,
  ) {}

  async create(recordData: any): Promise<LoadRecord> {
    const session = await this.sessionRepository.findOne({
      where: { id: recordData.sessionId },
    });
    if (!session) {
      throw new NotFoundException('训练课程不存在');
    }

    const athlete = await this.userRepository.findOne({
      where: { id: recordData.athleteId },
    });
    if (!athlete) {
      throw new NotFoundException('队员不存在');
    }

    let exerciseName = recordData.exerciseName;
    if (recordData.exerciseId) {
      const exercise = await this.exerciseRepository.findOne({
        where: { id: recordData.exerciseId },
      });
      if (exercise) {
        exerciseName = exercise.name;
      }
    }

    let totalLoad = 0;
    if (recordData.reps && recordData.weights) {
      const reps = recordData.reps as number[];
      const weights = recordData.weights as number[];
      for (let i = 0; i < reps.length; i++) {
        totalLoad += (reps[i] || 0) * (weights[i] || 0);
      }
    } else if (recordData.durationMinutes && recordData.distanceKm) {
      totalLoad = recordData.durationMinutes * recordData.distanceKm;
    }

    const record = this.loadRecordRepository.create({
      ...recordData,
      exerciseName,
      totalLoad,
    }) as unknown as LoadRecord;

    return this.loadRecordRepository.save(record);
  }

  async createBatch(records: any[]): Promise<LoadRecord[]> {
    const createdRecords: LoadRecord[] = [];
    for (const recordData of records) {
      const record = await this.create(recordData);
      createdRecords.push(record);
    }
    return createdRecords;
  }

  async getSessionRecords(sessionId: string): Promise<LoadRecord[]> {
    return this.loadRecordRepository.find({
      where: { sessionId },
      relations: ['athlete', 'exercise'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAthleteRecords(
    athleteId: string,
    startDate?: Date,
    endDate?: Date,
    exerciseId?: string,
  ): Promise<LoadRecord[]> {
    const where: any = { athleteId };

    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    if (exerciseId) {
      where.exerciseId = exerciseId;
    }

    return this.loadRecordRepository.find({
      where,
      relations: ['exercise', 'session'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<LoadRecord> {
    const record = await this.loadRecordRepository.findOne({
      where: { id },
      relations: ['athlete', 'exercise', 'session'],
    });
    if (!record) {
      throw new NotFoundException('负荷记录不存在');
    }
    return record;
  }

  async update(id: string, recordData: any): Promise<LoadRecord> {
    const record = await this.findById(id);

    let totalLoad = record.totalLoad;
    if (recordData.reps && recordData.weights) {
      totalLoad = 0;
      const reps = recordData.reps as number[];
      const weights = recordData.weights as number[];
      for (let i = 0; i < reps.length; i++) {
        totalLoad += (reps[i] || 0) * (weights[i] || 0);
      }
    }

    Object.assign(record, recordData, { totalLoad });
    return this.loadRecordRepository.save(record);
  }

  async delete(id: string): Promise<void> {
    const result = await this.loadRecordRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('负荷记录不存在');
    }
  }

  async getAthleteProgressCurve(
    athleteId: string,
    exerciseId: string,
    days: number = 30,
  ): Promise<ProgressPoint[]> {
    const endDate = new Date();
    const startDate = dayjs().subtract(days, 'day').toDate();

    const records = await this.loadRecordRepository.find({
      where: {
        athleteId,
        exerciseId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'ASC' },
    });

    const dailyMap = new Map<string, { weight: number; count: number }>();

    for (const record of records) {
      const date = dayjs(record.createdAt).format('YYYY-MM-DD');
      if (record.weights && record.weights.length > 0) {
        const maxWeight = Math.max(...record.weights);
        const existing = dailyMap.get(date);
        if (existing) {
          existing.weight = Math.max(existing.weight, maxWeight);
          existing.count++;
        } else {
          dailyMap.set(date, { weight: maxWeight, count: 1 });
        }
      }
    }

    const result: ProgressPoint[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const data = dailyMap.get(date);
      if (data) {
        result.push({
          date,
          value: data.weight,
          exerciseId,
        });
      }
    }

    return result;
  }

  async getAthleteWeeklyLoad(athleteId: string): Promise<any> {
    const endDate = new Date();
    const startDate = dayjs().subtract(7, 'day').toDate();

    const records = await this.loadRecordRepository.find({
      where: {
        athleteId,
        createdAt: Between(startDate, endDate),
      },
    });

    const dailyMap = new Map<string, number>();
    let totalLoad = 0;
    let totalRPE = 0;
    let rpeCount = 0;

    for (const record of records) {
      const date = dayjs(record.createdAt).format('YYYY-MM-DD');
      const existing = dailyMap.get(date) || 0;
      dailyMap.set(date, existing + (record.totalLoad || 0));
      totalLoad += record.totalLoad || 0;
      if (record.rpe) {
        totalRPE += record.rpe;
        rpeCount++;
      }
    }

    const daily: { date: string; load: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      daily.push({
        date,
        load: dailyMap.get(date) || 0,
      });
    }

    return {
      totalLoad,
      avgRPE: rpeCount > 0 ? totalRPE / rpeCount : 0,
      daily,
    };
  }

  async getAthleteHeartRateStats(athleteId: string, days: number = 7): Promise<any> {
    const endDate = new Date();
    const startDate = dayjs().subtract(days, 'day').toDate();

    const records = await this.loadRecordRepository.find({
      where: {
        athleteId,
        createdAt: Between(startDate, endDate),
      },
    });

    const avgHRs: { date: string; avgHeartRate: number }[] = [];
    const maxHRs: { date: string; maxHeartRate: number }[] = [];
    const dailyAvgMap = new Map<string, { sum: number; count: number }>();
    const dailyMaxMap = new Map<string, number>();

    for (const record of records) {
      const date = dayjs(record.createdAt).format('YYYY-MM-DD');
      if (record.avgHeartRate) {
        const existing = dailyAvgMap.get(date) || { sum: 0, count: 0 };
        existing.sum += record.avgHeartRate;
        existing.count++;
        dailyAvgMap.set(date, existing);
      }
      if (record.maxHeartRate) {
        const existing = dailyMaxMap.get(date) || 0;
        dailyMaxMap.set(date, Math.max(existing, record.maxHeartRate));
      }
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      const avgData = dailyAvgMap.get(date);
      avgHRs.push({
        date,
        avgHeartRate: avgData ? avgData.sum / avgData.count : 0,
      });
      maxHRs.push({
        date,
        maxHeartRate: dailyMaxMap.get(date) || 0,
      });
    }

    return { avgHRs, maxHRs };
  }
}
