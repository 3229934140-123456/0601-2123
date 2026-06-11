import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as dayjs from 'dayjs';
import { TrainingSession } from '../../entities/training-session.entity';
import { Team } from '../../entities/team.entity';
import { User, UserRole } from '../../entities/user.entity';
import { Attendance, AttendanceStatus } from '../../entities/attendance.entity';
import { TrainingPlanService } from '../training-plan/training-plan.service';
import { AttendanceService } from '../attendance/attendance.service';
import { TeamService } from '../team/team.service';

export interface DashboardData {
  teamId: string;
  teamName: string;
  date: string;
  sessions: Array<{
    id: string;
    title: string;
    type: string;
    startTime: string;
    endTime: string;
    location: string;
    coaches: string[];
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
  coaches: string[];
  remainingMinutes: number;
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
    private trainingPlanService: TrainingPlanService,
    private attendanceService: AttendanceService,
    private teamService: TeamService,
  ) {}

  async getDashboardForTeam(teamId: string, date?: string): Promise<DashboardData> {
    const team = await this.teamRepository.findOne({ where: { id: teamId } });
    const targetDate = date ? dayjs(date) : dayjs();
    const startOfDay = targetDate.startOf('day').toDate();
    const endOfDay = targetDate.endOf('day').toDate();

    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.plan', 'plan')
      .leftJoinAndSelect('session.coaches', 'coaches')
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
        coaches: session.coaches?.map((c) => c.name) || [],
        athleteCount: athletes.length,
        attendance,
      });
    }

    return {
      teamId,
      teamName: team?.name || '',
      date: targetDate.format('YYYY年MM月DD日 dddd'),
      sessions: sessionData,
      alerts: [],
    };
  }

  async getNextTrainingReminder(athleteId: string): Promise<TrainingReminder | null> {
    const session = await this.trainingPlanService.getNextSessionForAthlete(athleteId);
    if (!session) {
      return null;
    }

    const coaches = session.coaches?.map((c) => c.name) || [];
    const remaining = dayjs(session.startTime).diff(dayjs(), 'minute');

    return {
      sessionId: session.id,
      title: session.title,
      type: session.type,
      startTime: dayjs(session.startTime).format('YYYY-MM-DD HH:mm'),
      endTime: dayjs(session.endTime).format('YYYY-MM-DD HH:mm'),
      location: session.location || '',
      coaches,
      remainingMinutes: remaining > 0 ? remaining : 0,
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
      coaches: s.coaches?.map((c) => c.name) || [],
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
        coaches: s.coaches?.map((c) => c.name) || [],
      })),
      nextReminder: reminder,
    };
  }
}
