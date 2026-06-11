import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as dayjs from 'dayjs';
import {
  InjuryRecord,
  InjuryStatus,
  InjurySeverity,
} from '../../entities/injury-record.entity';
import { LoadRecordService } from '../load-record/load-record.service';

export interface FatigueAlert {
  athleteId: string;
  athleteName: string;
  alertType: 'overload' | 'heart_rate' | 'rpe' | 'injury' | 'sharp_increase';
  level: 'warning' | 'danger';
  message: string;
  details?: any;
}

@Injectable()
export class InjuryService {
  constructor(
    @InjectRepository(InjuryRecord)
    private injuryRepository: Repository<InjuryRecord>,
    private loadRecordService: LoadRecordService,
  ) {}

  async create(injuryData: Partial<InjuryRecord>): Promise<InjuryRecord> {
    const injury = this.injuryRepository.create(injuryData);
    return this.injuryRepository.save(injury);
  }

  async getAthleteInjuries(
    athleteId: string,
    status?: InjuryStatus,
  ): Promise<InjuryRecord[]> {
    const where: any = { athleteId };
    if (status) {
      where.status = status;
    }
    return this.injuryRepository.find({
      where,
      order: { injuryDate: 'DESC' },
    });
  }

  async getTeamActiveInjuries(athleteIds: string[]): Promise<InjuryRecord[]> {
    return this.injuryRepository.find({
      where: {
        athleteId: In(athleteIds),
        status: In([InjuryStatus.ACTIVE, InjuryStatus.RECOVERING]),
      },
      relations: ['athlete'],
      order: { injuryDate: 'DESC' },
    });
  }

  async findById(id: string): Promise<InjuryRecord> {
    const injury = await this.injuryRepository.findOne({
      where: { id },
      relations: ['athlete'],
    });
    if (!injury) {
      throw new NotFoundException('伤病记录不存在');
    }
    return injury;
  }

  async update(id: string, injuryData: Partial<InjuryRecord>): Promise<InjuryRecord> {
    const injury = await this.findById(id);
    Object.assign(injury, injuryData);
    return this.injuryRepository.save(injury);
  }

  async delete(id: string): Promise<void> {
    const result = await this.injuryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('伤病记录不存在');
    }
  }

  async updateStatus(id: string, status: InjuryStatus): Promise<InjuryRecord> {
    const injury = await this.findById(id);
    injury.status = status;
    return this.injuryRepository.save(injury);
  }

  async getAthleteLoadLimit(athleteId: string): Promise<number> {
    const activeInjuries = await this.getAthleteInjuries(
      athleteId,
      InjuryStatus.ACTIVE,
    );

    if (activeInjuries.length === 0) {
      return 100;
    }

    let minLimit = 100;
    for (const injury of activeInjuries) {
      minLimit = Math.min(minLimit, injury.trainingLoadLimit);
    }
    return minLimit;
  }

  async getAthleteFatigueAlerts(athleteId: string, athleteName: string): Promise<FatigueAlert[]> {
    const alerts: FatigueAlert[] = [];

    const weeklyLoad = await this.loadRecordService.getAthleteWeeklyLoad(athleteId);
    const hrStats = await this.loadRecordService.getAthleteHeartRateStats(athleteId, 7);

    if (weeklyLoad.avgRPE > 7) {
      alerts.push({
        athleteId,
        athleteName,
        alertType: 'rpe',
        level: weeklyLoad.avgRPE >= 9 ? 'danger' : 'warning',
        message: `本周平均主观疲劳评分 ${weeklyLoad.avgRPE.toFixed(1)}，${weeklyLoad.avgRPE >= 9 ? '过高' : '偏高'}`,
        details: { avgRPE: weeklyLoad.avgRPE },
      });
    }

    const recentAvgHRs = hrStats.avgHRs.filter((h) => h.avgHeartRate > 0);
    if (recentAvgHRs.length >= 3) {
      const avg = recentAvgHRs.reduce((s, h) => s + h.avgHeartRate, 0) / recentAvgHRs.length;
      if (avg > 160) {
        alerts.push({
          athleteId,
          athleteName,
          alertType: 'heart_rate',
          level: avg > 175 ? 'danger' : 'warning',
          message: `近期训练平均心率 ${avg.toFixed(0)} bpm，${avg > 175 ? '过高' : '偏高'}`,
          details: { avgHeartRate: avg },
        });
      }
    }

    const activeInjuries = await this.getAthleteInjuries(athleteId, InjuryStatus.ACTIVE);
    if (activeInjuries.length > 0) {
      alerts.push({
        athleteId,
        athleteName,
        alertType: 'injury',
        level: 'warning',
        message: `当前有 ${activeInjuries.length} 项活跃伤病，训练量限制为 ${Math.min(...activeInjuries.map((i) => i.trainingLoadLimit))}%`,
        details: activeInjuries.map((i) => ({
          bodyPart: i.bodyPart,
          severity: i.severity,
          loadLimit: i.trainingLoadLimit,
        })),
      });
    }

    return alerts;
  }

  async getTeamFatigueAlerts(athleteIds: string[], athleteNames: Map<string, string>): Promise<FatigueAlert[]> {
    const allAlerts: FatigueAlert[] = [];

    for (const athleteId of athleteIds) {
      const name = athleteNames.get(athleteId) || athleteId;
      const alerts = await this.getAthleteFatigueAlerts(athleteId, name);
      allAlerts.push(...alerts);
    }

    return allAlerts.sort((a, b) => {
      const levelOrder = { danger: 0, warning: 1 };
      return levelOrder[a.level] - levelOrder[b.level];
    });
  }

  getInjuryStatuses(): string[] {
    return Object.values(InjuryStatus);
  }

  getInjurySeverities(): string[] {
    return Object.values(InjurySeverity);
  }
}
