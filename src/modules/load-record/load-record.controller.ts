import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { LoadRecordService } from './load-record.service';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

class CreateLoadRecordDto {
  @IsString()
  sessionId: string;

  @IsString()
  athleteId: string;

  @IsString()
  @IsOptional()
  exerciseId?: string;

  @IsString()
  @IsOptional()
  exerciseName?: string;

  @IsInt()
  @IsOptional()
  sets?: number;

  @IsArray()
  @IsOptional()
  reps?: number[];

  @IsArray()
  @IsOptional()
  weights?: number[];

  @IsNumber()
  @IsOptional()
  avgHeartRate?: number;

  @IsNumber()
  @IsOptional()
  maxHeartRate?: number;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  rpe?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsNumber()
  @IsOptional()
  distanceKm?: number;
}

class UpdateLoadRecordDto {
  @IsInt()
  @IsOptional()
  sets?: number;

  @IsArray()
  @IsOptional()
  reps?: number[];

  @IsArray()
  @IsOptional()
  weights?: number[];

  @IsNumber()
  @IsOptional()
  avgHeartRate?: number;

  @IsNumber()
  @IsOptional()
  maxHeartRate?: number;

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  rpe?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  durationMinutes?: number;

  @IsNumber()
  @IsOptional()
  distanceKm?: number;
}

@Controller('load-records')
@UseGuards(JwtAuthGuard)
export class LoadRecordController {
  constructor(private loadRecordService: LoadRecordService) {}

  @Post()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async create(@Body() dto: CreateLoadRecordDto) {
    return this.loadRecordService.create(dto);
  }

  @Post('batch')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async createBatch(@Body() dtos: CreateLoadRecordDto[]) {
    return this.loadRecordService.createBatch(dtos);
  }

  @Get('session/:sessionId')
  async getSessionRecords(@Param('sessionId') sessionId: string) {
    return this.loadRecordService.getSessionRecords(sessionId);
  }

  @Get('athlete/:athleteId')
  async getAthleteRecords(
    @Param('athleteId') athleteId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('exerciseId') exerciseId?: string,
  ) {
    return this.loadRecordService.getAthleteRecords(
      athleteId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      exerciseId,
    );
  }

  @Get('my-records')
  async getMyRecords(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('exerciseId') exerciseId?: string,
  ) {
    return this.loadRecordService.getAthleteRecords(
      req.user.sub,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      exerciseId,
    );
  }

  @Get('progress-curve')
  async getProgressCurve(
    @Request() req,
    @Query('exerciseId') exerciseId: string,
    @Query('athleteId') athleteId?: string,
    @Query('days') days?: number,
  ) {
    const targetAthleteId = athleteId || req.user.sub;
    return this.loadRecordService.getAthleteProgressCurve(
      targetAthleteId,
      exerciseId,
      days ? parseInt(days as any, 10) : 30,
    );
  }

  @Get('weekly-load')
  async getWeeklyLoad(@Request() req, @Query('athleteId') athleteId?: string) {
    const targetAthleteId = athleteId || req.user.sub;
    return this.loadRecordService.getAthleteWeeklyLoad(targetAthleteId);
  }

  @Get('heart-rate-stats')
  async getHeartRateStats(
    @Request() req,
    @Query('athleteId') athleteId?: string,
    @Query('days') days?: number,
  ) {
    const targetAthleteId = athleteId || req.user.sub;
    return this.loadRecordService.getAthleteHeartRateStats(
      targetAthleteId,
      days ? parseInt(days as any, 10) : 7,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.loadRecordService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateLoadRecordDto) {
    return this.loadRecordService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.loadRecordService.delete(id);
    return { message: '删除成功' };
  }
}
