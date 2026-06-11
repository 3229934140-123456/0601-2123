import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import * as dayjs from 'dayjs';
import { Attendance, AttendanceStatus } from '../../entities/attendance.entity';
import { TrainingSession } from '../../entities/training-session.entity';
import { User } from '../../entities/user.entity';
import { TrainingPlanService } from '../training-plan/training-plan.service';

export interface AttendanceSummary {
  sessionId: string;
  sessionTitle: string;
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  notRecorded: number;
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(TrainingSession)
    private sessionRepository: Repository<TrainingSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private trainingPlanService: TrainingPlanService,
  ) {}

  async initSessionAttendance(sessionId: string): Promise<Attendance[]> {
    const session = await this.trainingPlanService.getSessionById(sessionId);
    const targetAthletes = this.trainingPlanService.getSessionTargetAthletes(session);

    if (targetAthletes.length === 0) {
      throw new BadRequestException('该课程没有指定参训队员');
    }

    const existingAttendances = await this.attendanceRepository.find({
      where: { sessionId },
    });
    const existingAthleteIds = new Set(existingAttendances.map((a) => a.athleteId));

    const newAttendances: Attendance[] = [];
    for (const athlete of targetAthletes) {
      if (!existingAthleteIds.has(athlete.id)) {
        const attendance = this.attendanceRepository.create({
          sessionId,
          athleteId: athlete.id,
          status: AttendanceStatus.NOT_RECORDED,
        });
        newAttendances.push(attendance);
      }
    }

    if (newAttendances.length > 0) {
      await this.attendanceRepository.save(newAttendances);
    }

    return this.getSessionAttendances(sessionId);
  }

  async checkIn(sessionId: string, athleteId: string): Promise<Attendance> {
    let attendance = await this.attendanceRepository.findOne({
      where: { sessionId, athleteId },
    });

    const now = new Date();

    if (attendance) {
      attendance.status = AttendanceStatus.PRESENT;
      attendance.checkInTime = now;
    } else {
      attendance = this.attendanceRepository.create({
        sessionId,
        athleteId,
        status: AttendanceStatus.PRESENT,
        checkInTime: now,
      });
    }

    return this.attendanceRepository.save(attendance);
  }

  async batchMarkAttendance(
    sessionId: string,
    records: { athleteId: string; status: AttendanceStatus; note?: string }[],
  ): Promise<Attendance[]> {
    const results: Attendance[] = [];

    for (const record of records) {
      let attendance = await this.attendanceRepository.findOne({
        where: { sessionId, athleteId: record.athleteId },
      });

      if (attendance) {
        attendance.status = record.status;
        attendance.note = record.note || attendance.note;
        if (record.status === AttendanceStatus.PRESENT && !attendance.checkInTime) {
          attendance.checkInTime = new Date();
        }
      } else {
        attendance = this.attendanceRepository.create({
          sessionId,
          athleteId: record.athleteId,
          status: record.status,
          note: record.note,
          checkInTime: record.status === AttendanceStatus.PRESENT ? new Date() : null,
        });
      }

      results.push(await this.attendanceRepository.save(attendance));
    }

    return results;
  }

  async getSessionAttendances(sessionId: string): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { sessionId },
      relations: ['athlete'],
      order: { createdAt: 'ASC' },
    });
  }

  async getAbsentList(sessionId: string): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: {
        sessionId,
        status: In([AttendanceStatus.ABSENT, AttendanceStatus.NOT_RECORDED]),
      },
      relations: ['athlete'],
    });
  }

  async getAthleteAttendanceRecords(
    athleteId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any[]> {
    const where: any = { athleteId };

    if (startDate && endDate) {
      const qb = this.attendanceRepository
        .createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.session', 'session')
        .where('attendance.athleteId = :athleteId', { athleteId })
        .andWhere('session.startTime BETWEEN :start AND :end', {
          start: startDate,
          end: endDate,
        })
        .orderBy('session.startTime', 'DESC');

      return qb.getMany();
    }

    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.session', 'session')
      .where('attendance.athleteId = :athleteId', { athleteId })
      .orderBy('session.startTime', 'DESC');

    return qb.getMany();
  }

  async getAthleteAttendanceStats(
    athleteId: string,
    days: number = 30,
  ): Promise<any> {
    const endDate = new Date();
    const startDate = dayjs().subtract(days, 'day').toDate();

    const records = await this.getAthleteAttendanceRecords(athleteId, startDate, endDate);

    let totalSessions = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    for (const record of records) {
      totalSessions++;
      switch (record.status) {
        case AttendanceStatus.PRESENT:
          presentCount++;
          break;
        case AttendanceStatus.ABSENT:
          absentCount++;
          break;
        case AttendanceStatus.LATE:
          lateCount++;
          break;
        case AttendanceStatus.EXCUSED:
          excusedCount++;
          break;
      }
    }

    return {
      totalSessions,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate: totalSessions > 0 ? presentCount / totalSessions : 0,
    };
  }

  async getTeamAttendanceSummary(
    teamId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<AttendanceSummary[]> {
    const sessions = await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoin('session.plan', 'plan')
      .where('plan.teamId = :teamId', { teamId })
      .andWhere('session.startTime BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getMany();

    const summaries: AttendanceSummary[] = [];

    for (const session of sessions) {
      const attendances = await this.getSessionAttendances(session.id);
      const summary: AttendanceSummary = {
        sessionId: session.id,
        sessionTitle: session.title,
        date: dayjs(session.startTime).format('YYYY-MM-DD'),
        total: attendances.length,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        notRecorded: 0,
      };

      for (const a of attendances) {
        switch (a.status) {
          case AttendanceStatus.PRESENT:
            summary.present++;
            break;
          case AttendanceStatus.ABSENT:
            summary.absent++;
            break;
          case AttendanceStatus.LATE:
            summary.late++;
            break;
          case AttendanceStatus.EXCUSED:
            summary.excused++;
            break;
          case AttendanceStatus.NOT_RECORDED:
            summary.notRecorded++;
            break;
        }
      }

      summaries.push(summary);
    }

    return summaries;
  }

  async updateAttendance(
    id: string,
    status: AttendanceStatus,
    note?: string,
  ): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({ where: { id } });
    if (!attendance) {
      throw new NotFoundException('签到记录不存在');
    }

    attendance.status = status;
    if (note !== undefined) {
      attendance.note = note;
    }
    if (status === AttendanceStatus.PRESENT && !attendance.checkInTime) {
      attendance.checkInTime = new Date();
    }

    return this.attendanceRepository.save(attendance);
  }
}
