import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as dayjs from 'dayjs';
import { TestScore, TestType } from '../../entities/test-score.entity';

export interface TestProgressPoint {
  date: string;
  value: number;
}

@Injectable()
export class TestScoreService {
  constructor(
    @InjectRepository(TestScore)
    private testScoreRepository: Repository<TestScore>,
  ) {}

  async create(scoreData: Partial<TestScore>): Promise<TestScore> {
    const score = this.testScoreRepository.create(scoreData);
    return this.testScoreRepository.save(score);
  }

  async createBatch(scores: Partial<TestScore>[]): Promise<TestScore[]> {
    const createdScores: TestScore[] = [];
    for (const scoreData of scores) {
      const score = await this.create(scoreData);
      createdScores.push(score);
    }
    return createdScores;
  }

  async getAthleteScores(
    athleteId: string,
    testType?: TestType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TestScore[]> {
    const where: any = { athleteId };

    if (testType) {
      where.testType = testType;
    }

    if (startDate && endDate) {
      where.testDate = Between(startDate, endDate);
    }

    return this.testScoreRepository.find({
      where,
      relations: ['session'],
      order: { testDate: 'DESC' },
    });
  }

  async getSessionScores(sessionId: string): Promise<TestScore[]> {
    return this.testScoreRepository.find({
      where: { sessionId },
      relations: ['athlete'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<TestScore> {
    const score = await this.testScoreRepository.findOne({
      where: { id },
      relations: ['athlete', 'session'],
    });
    if (!score) {
      throw new NotFoundException('测试成绩不存在');
    }
    return score;
  }

  async update(id: string, scoreData: Partial<TestScore>): Promise<TestScore> {
    const score = await this.findById(id);
    Object.assign(score, scoreData);
    return this.testScoreRepository.save(score);
  }

  async delete(id: string): Promise<void> {
    const result = await this.testScoreRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('测试成绩不存在');
    }
  }

  async getAthleteTestProgress(
    athleteId: string,
    testName: string,
    days: number = 90,
  ): Promise<TestProgressPoint[]> {
    const endDate = new Date();
    const startDate = dayjs().subtract(days, 'day').toDate();

    const scores = await this.testScoreRepository.find({
      where: {
        athleteId,
        testName,
        testDate: Between(startDate, endDate),
      },
      order: { testDate: 'ASC' },
    });

    const result: TestProgressPoint[] = scores.map((s) => ({
      date: dayjs(s.testDate).format('YYYY-MM-DD'),
      value: s.value,
    }));

    return result;
  }

  async getAthleteLatestScores(athleteId: string): Promise<TestScore[]> {
    const allScores = await this.testScoreRepository.find({
      where: { athleteId },
      order: { testDate: 'DESC' },
    });

    const latestMap = new Map<string, TestScore>();
    for (const score of allScores) {
      if (!latestMap.has(score.testName)) {
        latestMap.set(score.testName, score);
      }
    }

    return Array.from(latestMap.values());
  }

  async getTestTypes(): Promise<string[]> {
    return Object.values(TestType);
  }
}
