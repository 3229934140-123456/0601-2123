import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThan } from 'typeorm';
import * as dayjs from 'dayjs';
import { TrainingPlan, PlanStatus } from '../../entities/training-plan.entity';
import { TrainingSession, TrainingType, SessionStatus } from '../../entities/training-session.entity';
import { Team } from '../../entities/team.entity';
import { AthleteGroup } from '../../entities/athlete-group.entity';
import { User, UserRole } from '../../entities/user.entity';

@Injectable()
export class TrainingPlanService {
  constructor(
    @InjectRepository(TrainingPlan)
    private planRepository: Repository<TrainingPlan>,
    @InjectRepository(TrainingSession)
    private sessionRepository: Repository<TrainingSession>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(AthleteGroup)
    private groupRepository: Repository<AthleteGroup>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createPlan(teamId: string, planData: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('队伍不存在');
    }

    const plan = this.planRepository.create({
      ...planData,
      teamId,
    });
    return this.planRepository.save(plan);
  }

  async getTeamPlans(teamId: string, status?: PlanStatus): Promise<TrainingPlan[]> {
    const where: any = { teamId };
    if (status) {
      where.status = status;
    }
    return this.planRepository.find({
      where,
      order: { startDate: 'DESC' },
    });
  }

  async getPlanById(id: string): Promise<TrainingPlan> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['team', 'sessions'],
    });
    if (!plan) {
      throw new NotFoundException('训练计划不存在');
    }
    return plan;
  }

  async updatePlan(id: string, planData: Partial<TrainingPlan>): Promise<TrainingPlan> {
    const plan = await this.getPlanById(id);
    Object.assign(plan, planData);
    return this.planRepository.save(plan);
  }

  async deletePlan(id: string): Promise<void> {
    const result = await this.planRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('训练计划不存在');
    }
  }

  async createSession(planId: string, sessionData: any): Promise<TrainingSession> {
    const plan = await this.getPlanById(planId);

    const session = this.sessionRepository.create({
      ...sessionData,
      planId,
    }) as unknown as TrainingSession;

    if (sessionData.coachIds?.length) {
      session.coaches = await this.userRepository.findBy({
        id: In(sessionData.coachIds),
        role: UserRole.COACH,
      });
    }

    if (sessionData.groupIds?.length) {
      session.targetGroups = await this.groupRepository.findBy({
        id: In(sessionData.groupIds),
      });
    }

    if (sessionData.athleteIds?.length) {
      session.targetAthletes = await this.userRepository.findBy({
        id: In(sessionData.athleteIds),
        role: UserRole.ATHLETE,
      });
    }

    return this.sessionRepository.save(session);
  }

  async getPlanSessions(planId: string): Promise<TrainingSession[]> {
    return this.sessionRepository.find({
      where: { planId },
      relations: ['coaches', 'targetGroups', 'targetAthletes'],
      order: { startTime: 'ASC' },
    });
  }

  async getSessionById(id: string): Promise<TrainingSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['coaches', 'targetGroups', 'targetGroups.athletes', 'targetAthletes', 'plan'],
    });
    if (!session) {
      throw new NotFoundException('训练课程不存在');
    }
    return session;
  }

  async updateSession(id: string, sessionData: any): Promise<TrainingSession> {
    const session = await this.getSessionById(id);
    Object.assign(session, sessionData);

    if (sessionData.coachIds !== undefined) {
      if (sessionData.coachIds.length === 0) {
        session.coaches = [];
      } else {
        session.coaches = await this.userRepository.findBy({
          id: In(sessionData.coachIds),
          role: UserRole.COACH,
        });
      }
    }

    if (sessionData.groupIds !== undefined) {
      if (sessionData.groupIds.length === 0) {
        session.targetGroups = [];
      } else {
        session.targetGroups = await this.groupRepository.findBy({
          id: In(sessionData.groupIds),
        });
      }
    }

    if (sessionData.athleteIds !== undefined) {
      if (sessionData.athleteIds.length === 0) {
        session.targetAthletes = [];
      } else {
        session.targetAthletes = await this.userRepository.findBy({
          id: In(sessionData.athleteIds),
          role: UserRole.ATHLETE,
        });
      }
    }

    return this.sessionRepository.save(session);
  }

  async deleteSession(id: string): Promise<void> {
    const result = await this.sessionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('训练课程不存在');
    }
  }

  async getTodaySessions(teamId?: string, athleteId?: string): Promise<TrainingSession[]> {
    const startOfDay = dayjs().startOf('day').toDate();
    const endOfDay = dayjs().endOf('day').toDate();

    const qb = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.coaches', 'coaches')
      .leftJoinAndSelect('session.targetGroups', 'targetGroups')
      .leftJoinAndSelect('session.targetAthletes', 'targetAthletes')
      .leftJoin('targetGroups.athletes', 'groupAthletes')
      .where('session.startTime BETWEEN :start AND :end', { start: startOfDay, end: endOfDay });

    if (teamId) {
      qb.leftJoin('session.plan', 'plan').andWhere('plan.teamId = :teamId', { teamId });
    }

    if (athleteId) {
      qb.andWhere(
        '(targetAthletes.id = :athleteId OR groupAthletes.id = :athleteId)',
        { athleteId },
      );
    }

    return qb.orderBy('session.startTime', 'ASC').getMany();
  }

  async getSessionsByDateRange(
    startDate: Date,
    endDate: Date,
    teamId?: string,
  ): Promise<TrainingSession[]> {
    const where: any = {
      startTime: Between(startDate, endDate),
    };

    const sessions = await this.sessionRepository.find({
      where,
      relations: ['coaches', 'targetGroups', 'targetAthletes', 'plan'],
      order: { startTime: 'ASC' },
    });

    if (teamId) {
      return sessions.filter((s) => s.plan?.teamId === teamId);
    }
    return sessions;
  }

  async getNextSessionForAthlete(athleteId: string): Promise<TrainingSession | null> {
    const now = new Date();
    const qb = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.coaches', 'coaches')
      .leftJoin('session.targetGroups', 'targetGroups')
      .leftJoin('targetGroups.athletes', 'groupAthletes')
      .leftJoin('session.targetAthletes', 'targetAthletes')
      .where('session.startTime > :now', { now })
      .andWhere(
        '(targetAthletes.id = :athleteId OR groupAthletes.id = :athleteId)',
        { athleteId },
      )
      .orderBy('session.startTime', 'ASC')
      .limit(1);

    return qb.getOne();
  }

  async updateSessionStatus(id: string, status: SessionStatus): Promise<TrainingSession> {
    const session = await this.getSessionById(id);
    session.status = status;
    return this.sessionRepository.save(session);
  }

  getSessionTargetAthletes(session: TrainingSession): User[] {
    const athleteMap = new Map<string, User>();

    if (session.targetAthletes) {
      session.targetAthletes.forEach((a) => athleteMap.set(a.id, a));
    }

    if (session.targetGroups) {
      session.targetGroups.forEach((group) => {
        if (group.athletes) {
          group.athletes.forEach((a) => athleteMap.set(a.id, a));
        }
      });
    }

    return Array.from(athleteMap.values());
  }

  async detectConflicts(options: {
    planId: string;
    startTime: Date;
    endTime: Date;
    coachIds?: string[];
    groupIds?: string[];
    athleteIds?: string[];
    excludeSessionId?: string;
  }): Promise<{
    hasConflict: boolean;
    conflicts: Array<{
      type: 'team' | 'coach' | 'group' | 'athlete';
      conflictId?: string;
      conflictName?: string;
      session: {
        id: string;
        title: string;
        startTime: Date;
        endTime: Date;
        type: string;
        location?: string;
      };
      overlapMinutes: number;
    }>;
  }> {
    const { planId, startTime, endTime, coachIds, groupIds, athleteIds, excludeSessionId } = options;

    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('训练计划不存在');
    }

    const conflicts: any[] = [];

    const allOverlappingSessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.plan', 'plan')
      .leftJoinAndSelect('session.coaches', 'coaches')
      .leftJoinAndSelect('session.targetGroups', 'targetGroups')
      .leftJoinAndSelect('session.targetAthletes', 'targetAthletes')
      .where('plan.teamId = :teamId', { teamId: plan.teamId })
      .andWhere('session.startTime < :endTime', { endTime })
      .andWhere('session.endTime > :startTime', { startTime })
      .getMany();

    const filteredSessions = excludeSessionId
      ? allOverlappingSessions.filter((s) => s.id !== excludeSessionId)
      : allOverlappingSessions;

    for (const session of filteredSessions) {
      const overlapStart = new Date(Math.max(startTime.getTime(), session.startTime.getTime()));
      const overlapEnd = new Date(Math.min(endTime.getTime(), session.endTime.getTime()));
      const overlapMinutes = Math.max(0, Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / 60000));

      if (overlapMinutes <= 0) continue;

      const sessionInfo = {
        id: session.id,
        title: session.title,
        startTime: session.startTime,
        endTime: session.endTime,
        type: session.type,
        location: session.location,
      };

      conflicts.push({
        type: 'team' as const,
        session: sessionInfo,
        overlapMinutes,
      });

      if (coachIds?.length && session.coaches?.length) {
        const commonCoaches = session.coaches.filter((c) => coachIds.includes(c.id));
        for (const coach of commonCoaches) {
          conflicts.push({
            type: 'coach' as const,
            conflictId: coach.id,
            conflictName: coach.name,
            session: sessionInfo,
            overlapMinutes,
          });
        }
      }

      if (groupIds?.length && session.targetGroups?.length) {
        const commonGroups = session.targetGroups.filter((g) => groupIds.includes(g.id));
        for (const group of commonGroups) {
          conflicts.push({
            type: 'group' as const,
            conflictId: group.id,
            conflictName: group.name,
            session: sessionInfo,
            overlapMinutes,
          });
        }
      }

      if (athleteIds?.length && session.targetAthletes?.length) {
        const commonAthletes = session.targetAthletes.filter((a) => athleteIds.includes(a.id));
        for (const athlete of commonAthletes) {
          conflicts.push({
            type: 'athlete' as const,
            conflictId: athlete.id,
            conflictName: athlete.name,
            session: sessionInfo,
            overlapMinutes,
          });
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }
}
