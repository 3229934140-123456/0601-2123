import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceStatus } from '../../entities/attendance.entity';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsString, IsOptional, IsEnum, IsArray, IsInt } from 'class-validator';

class AttendanceRecordDto {
  @IsString()
  athleteId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsString()
  @IsOptional()
  note?: string;
}

class BatchAttendanceDto {
  @IsArray()
  records: AttendanceRecordDto[];
}

class UpdateAttendanceDto {
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsString()
  @IsOptional()
  note?: string;
}

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('session/:sessionId/init')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async initSessionAttendance(@Param('sessionId') sessionId: string) {
    return this.attendanceService.initSessionAttendance(sessionId);
  }

  @Post('check-in')
  async checkIn(
    @Body() { sessionId }: { sessionId: string },
    @Request() req,
  ) {
    const athleteId = req.user.sub;
    return this.attendanceService.checkIn(sessionId, athleteId);
  }

  @Post('coach-check-in')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async coachCheckIn(
    @Body() { sessionId, athleteId }: { sessionId: string; athleteId: string },
  ) {
    return this.attendanceService.checkIn(sessionId, athleteId);
  }

  @Post('session/:sessionId/batch')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async batchMarkAttendance(
    @Param('sessionId') sessionId: string,
    @Body() dto: BatchAttendanceDto,
  ) {
    return this.attendanceService.batchMarkAttendance(sessionId, dto.records);
  }

  @Get('session/:sessionId')
  async getSessionAttendances(@Param('sessionId') sessionId: string) {
    return this.attendanceService.getSessionAttendances(sessionId);
  }

  @Get('session/:sessionId/absent')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async getAbsentList(@Param('sessionId') sessionId: string) {
    return this.attendanceService.getAbsentList(sessionId);
  }

  @Get('athlete/:athleteId')
  async getAthleteRecords(
    @Param('athleteId') athleteId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getAthleteAttendanceRecords(
      athleteId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('my-records')
  async getMyRecords(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getAthleteAttendanceRecords(
      req.user.sub,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('athlete/:athleteId/stats')
  async getAthleteStats(
    @Param('athleteId') athleteId: string,
    @Query('days') days?: number,
  ) {
    return this.attendanceService.getAthleteAttendanceStats(
      athleteId,
      days ? parseInt(days as any, 10) : 30,
    );
  }

  @Get('my-stats')
  async getMyStats(@Request() req, @Query('days') days?: number) {
    return this.attendanceService.getAthleteAttendanceStats(
      req.user.sub,
      days ? parseInt(days as any, 10) : 30,
    );
  }

  @Get('team/:teamId/summary')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async getTeamSummary(
    @Param('teamId') teamId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.attendanceService.getTeamAttendanceSummary(
      teamId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Put(':id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async updateAttendance(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.updateAttendance(id, dto.status, dto.note);
  }
}
