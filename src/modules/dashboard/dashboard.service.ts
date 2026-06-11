import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as dayjs from 'dayjs';
import { TrainingSession } from '../../entities/training-session.entity';
import { Team } from '../../entities/team.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Attendance, AttendanceStatus } from '../../entities/attendance.entity';
import { AthleteGroup } from '../../entities/athlete-group.entity';
import { TrainingPlanService } from '../training-plan/training-plan.service';
import { AttendanceService } from '../attendance/attendance.service';
import { TeamService } from '../team/team.service';

export interface DashboardData {
  teamId: string;
  teamName: string;
  date: string;
  teamCoaches: Array<{ id: string; name: string }>;
  sessions: Array<{
    id: string;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    location: string;
    sessionCoaches: Array<{ id: string; name: string }>;
    targetGroups: Array<{ id: string; name: string }>;
    athleteCount: number;
    attendance: {
      present: number;
      absent: number;
      late: number;
      excused: number;
      notRecorded: number;
      total: number;
    };
  }>;
  alerts: Array<{
    type: string;
    level: string;
    message: string;
  }>;
}

export interface TrainingReminder {
  sessionId: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  location: string;
  coaches: Array<{ id: string; name: string }>;
  remainingMinutes: number;
  participationReason: {
    type: 'group' | 'individual';
    groupName?: string;
    groupId?: string;
  };
}

export interface WeeklyCalendar {
  teamId: string;
  teamName: string;
  teamCoaches: Array<{ id: string; name: string }>;
  startDate: string;
  endDate: string;
  days: Array<{
    date: string;
    dayOfWeek: string;
    sessions: Array<{
      id: string;
      title: string;
      type: string;
      startTime: string;
      endTime: string;
      location: string;
      sessionCoaches: Array<{ id: string; name: string }>;
      targetGroups: Array<{ id: string; name: string }>;
      targetAthleteCount: number;
    }>;
  }>;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(TrainingSession)
    private sessionRepository: Repository<TrainingSession>,
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(AthleteGroup)
    private groupRepository: Repository<AthleteGroup>,
    private trainingPlanService: TrainingPlanService,
    private attendanceService: AttendanceService,
    private teamService: TeamService,
  ) {}

  private formatCoach(user: User) {
    return { id: user.id, name: user.name };
  }

  private formatGroup(group: AthleteGroup) {
    return { id: group.id, name: group.name };
  }

  async getDashboardForTeam(teamId: string, date?: string): Promise<DashboardData> {
    const team = await this.teamService.findById(teamId);
    const targetDate = date ? dayjs(date) : dayjs();
    const startOfDay = targetDate.startOf('day').toDate();
    const endOfDay = targetDate.endOf('day').toDate();

    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.plan', 'plan')
      .leftJoinAndSelect('session.coaches', 'coaches')
      .leftJoinAndSelect('session.targetGroups', 'targetGroups')
      .where('plan.teamId = :teamId', { teamId })
      .andWhere('session.startTime BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .orderBy('session.startTime', 'ASC')
      .getMany();

    const sessionData = [];

    for (const session of sessions) {
      const fullSession = await this.trainingPlanService.getSessionById(session.id);
      const athletes = this.trainingPlanService.getSessionTargetAthletes(fullSession);
      const attendances = await this.attendanceService.getSessionAttendances(session.id);

      const attendance = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        notRecorded: 0,
        total: athletes.length,
      };

      for (const a of attendances) {
        switch (a.status) {
          case AttendanceStatus.PRESENT:
            attendance.present++;
            break;
          case AttendanceStatus.ABSENT:
            attendance.absent++;
            break;
          case AttendanceStatus.LATE:
            attendance.late++;
            break;
          case AttendanceStatus.EXCUSED:
            attendance.excused++;
            break;
          case AttendanceStatus.NOT_RECORDED:
            attendance.notRecorded++;
            break;
        }
      }

      sessionData.push({
        id: session.id,
        title: session.title,
        type: session.type,
        startTime: dayjs(session.startTime).format('HH:mm'),
        endTime: dayjs(session.endTime).format('HH:mm'),
        location: session.location || '',
        sessionCoaches: (session.coaches || []).map((c) => this.formatCoach(c)),
        targetGroups: (session.targetGroups || []).map((g) => this.formatGroup(g)),
        athleteCount: athletes.length,
        attendance,
      });
    }

    return {
      teamId,
      teamName: team?.name || '',
      date: targetDate.format('YYYY年MM月DD日 dddd'),
      teamCoaches: (team?.coaches || []).map((c) => this.formatCoach(c)),
      sessions: sessionData,
      alerts: [],
    };
  }

  async getNextTrainingReminder(athleteId: string): Promise<TrainingReminder | null> {
    const session = await this.trainingPlanService.getNextSessionForAthlete(athleteId);
    if (!session) {
      return null;
    }

    const coaches = (session.coaches || []).map((c) => this.formatCoach(c));
    const remaining = dayjs(session.startTime).diff(dayjs(), 'minute');

    let participationReason: TrainingReminder['participationReason'] = {
      type: 'individual',
    };

    if (session.targetAthletes?.some((a) => a.id === athleteId)) {
      participationReason = { type: 'individual' };
    } else if (session.targetGroups?.length) {
      for (const group of session.targetGroups) {
        if (group.athletes?.some((a) => a.id === athleteId)) {
          participationReason = {
            type: 'group',
            groupName: group.name,
            groupId: group.id,
          };
          break;
        }
      }
    }

    return {
      sessionId: session.id,
      title: session.title,
      type: session.type,
      startTime: dayjs(session.startTime).format('YYYY-MM-DD HH:mm'),
      endTime: dayjs(session.endTime).format('YYYY-MM-DD HH:mm'),
      location: session.location || '',
      coaches,
      remainingMinutes: remaining > 0 ? remaining : 0,
      participationReason,
    };
  }

  async getUpcomingTrainings(athleteId: string, days: number = 7): Promise<any[]> {
    const startDate = new Date();
    const endDate = dayjs().add(days, 'day').toDate();

    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoin('session.targetGroups', 'targetGroups')
      .leftJoin('targetGroups.athletes', 'groupAthletes')
      .leftJoin('session.targetAthletes', 'targetAthletes')
      .leftJoinAndSelect('session.coaches', 'coaches')
      .where('session.startTime BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere(
        '(targetAthletes.id = :athleteId OR groupAthletes.id = :athleteId)',
        { athleteId },
      )
      .orderBy('session.startTime', 'ASC')
      .getMany();

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      status: s.status,
      startTime: s.startTime,
      endTime: s.endTime,
      location: s.location,
      coaches: (s.coaches || []).map((c) => this.formatCoach(c)),
    }));
  }

  async getAthleteDailyBriefing(athleteId: string): Promise<any> {
    const today = dayjs().format('YYYY-MM-DD');
    const todaySessions = await this.trainingPlanService.getTodaySessions(undefined, athleteId);
    const reminder = await this.getNextTrainingReminder(athleteId);

    return {
      date: today,
      todaySessions: todaySessions.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        startTime: dayjs(s.startTime).format('HH:mm'),
        endTime: dayjs(s.endTime).format('HH:mm'),
        location: s.location,
        coaches: (s.coaches || []).map((c) => this.formatCoach(c)),
      })),
      nextReminder: reminder,
    };
  }

  async getWeeklyCalendar(teamId: string, startDate?: string, endDate?: string): Promise<WeeklyCalendar> {
    const team = await this.teamService.findById(teamId);
    const start = startDate ? dayjs(startDate) : dayjs().startOf('week');
    const end = endDate ? dayjs(endDate) : start.add(6, 'day');
    const startDt = start.startOf('day').toDate();
    const endDt = end.endOf('day').toDate();

    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.plan', 'plan')
      .leftJoinAndSelect('session.coaches', 'coaches')
      .leftJoinAndSelect('session.targetGroups', 'targetGroups')
      .leftJoinAndSelect('session.targetAthletes', 'targetAthletes')
      .where('plan.teamId = :teamId', { teamId })
      .andWhere('session.startTime BETWEEN :start AND :end', { start: startDt, end: endDt })
      .orderBy('session.startTime', 'ASC')
      .getMany();

    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const days: WeeklyCalendar['days'] = [];
    const totalDays = end.diff(start, 'day') + 1;

    for (let i = 0; i < totalDays; i++) {
      const current = start.add(i, 'day');
      const dayStart = current.startOf('day');
      const dayEnd = current.endOf('day');

      const daySessions = sessions.filter((s) => {
        const sessionTime = dayjs(s.startTime);
        return sessionTime.isAfter(dayStart) && sessionTime.isBefore(dayEnd);
      });

      days.push({
        date: current.format('YYYY-MM-DD'),
        dayOfWeek: dayNames[current.day()],
        sessions: daySessions.map((s) => ({
          id: s.id,
          title: s.title,
          type: s.type,
          startTime: dayjs(s.startTime).format('HH:mm'),
          endTime: dayjs(s.endTime).format('HH:mm'),
          location: s.location || '',
          sessionCoaches: (s.coaches || []).map((c) => this.formatCoach(c)),
          targetGroups: (s.targetGroups || []).map((g) => this.formatGroup(g)),
          targetAthleteCount: s.targetAthletes?.length || 0,
        })),
      });
    }

    return {
      teamId,
      teamName: team?.name || '',
      teamCoaches: (team?.coaches || []).map((c) => this.formatCoach(c)),
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
      days,
    };
  }
}
