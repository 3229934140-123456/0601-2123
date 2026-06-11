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
import { TrainingPlanService } from './training-plan.service';
import { UserRole } from '../../entities/user.entity';
import { PlanStatus } from '../../entities/training-plan.entity';
import { TrainingType, SessionStatus } from '../../entities/training-session.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsNumber,
} from 'class-validator';

class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

class UpdatePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;
}

class CreateSessionDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TrainingType)
  type: TrainingType;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsNumber()
  @IsOptional()
  plannedDuration?: number;

  @IsNumber()
  @IsOptional()
  intensityLevel?: number;

  @IsArray()
  @IsOptional()
  coachIds?: string[];

  @IsArray()
  @IsOptional()
  groupIds?: string[];

  @IsArray()
  @IsOptional()
  athleteIds?: string[];
}

class UpdateSessionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TrainingType)
  @IsOptional()
  type?: TrainingType;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;

  @IsNumber()
  @IsOptional()
  plannedDuration?: number;

  @IsNumber()
  @IsOptional()
  intensityLevel?: number;

  @IsArray()
  @IsOptional()
  coachIds?: string[];

  @IsArray()
  @IsOptional()
  groupIds?: string[];

  @IsArray()
  @IsOptional()
  athleteIds?: string[];
}

class UpdateSessionStatusDto {
  @IsEnum(SessionStatus)
  status: SessionStatus;
}

@Controller('training')
@UseGuards(JwtAuthGuard)
export class TrainingPlanController {
  constructor(private trainingPlanService: TrainingPlanService) {}

  @Post('plans')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async createPlan(@Body() dto: CreatePlanDto & { teamId: string }) {
    return this.trainingPlanService.createPlan(dto.teamId, {
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });
  }

  @Get('plans')
  async getTeamPlans(@Query('teamId') teamId: string) {
    return this.trainingPlanService.getTeamPlans(teamId);
  }

  @Get('plans/:id')
  async getPlanById(@Param('id') id: string) {
    return this.trainingPlanService.getPlanById(id);
  }

  @Put('plans/:id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const updateData: any = { ...dto };
    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      updateData.endDate = new Date(dto.endDate);
    }
    return this.trainingPlanService.updatePlan(id, updateData);
  }

  @Delete('plans/:id')
  @Roles(UserRole.ADMIN)
  async deletePlan(@Param('id') id: string) {
    await this.trainingPlanService.deletePlan(id);
    return { message: '删除成功' };
  }

  @Post('plans/:planId/sessions')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async createSession(@Param('planId') planId: string, @Body() dto: CreateSessionDto) {
    return this.trainingPlanService.createSession(planId, dto);
  }

  @Get('plans/:planId/sessions')
  async getPlanSessions(@Param('planId') planId: string) {
    return this.trainingPlanService.getPlanSessions(planId);
  }

  @Get('sessions/today')
  async getTodaySessions(@Query('teamId') teamId: string, @Request() req) {
    if (req.user.role === UserRole.ATHLETE) {
      return this.trainingPlanService.getTodaySessions(undefined, req.user.sub);
    }
    return this.trainingPlanService.getTodaySessions(teamId);
  }

  @Get('sessions/next')
  async getNextSession(@Request() req) {
    if (req.user.role === UserRole.ATHLETE) {
      return this.trainingPlanService.getNextSessionForAthlete(req.user.sub);
    }
    return null;
  }

  @Get('sessions/by-date')
  async getSessionsByDate(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('teamId') teamId?: string,
  ) {
    return this.trainingPlanService.getSessionsByDateRange(
      new Date(startDate),
      new Date(endDate),
      teamId,
    );
  }

  @Get('sessions/conflicts')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async checkConflicts(
    @Query('planId') planId: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
    @Query('excludeSessionId') excludeSessionId?: string,
  ) {
    return this.trainingPlanService.detectConflicts({
      planId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      excludeSessionId,
    });
  }

  @Post('sessions/conflicts')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async checkConflictsDetailed(
    @Body()
    body: {
      planId: string;
      startTime: string;
      endTime: string;
      coachIds?: string[];
      groupIds?: string[];
      athleteIds?: string[];
      excludeSessionId?: string;
    },
  ) {
    return this.trainingPlanService.detectConflicts({
      planId: body.planId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      coachIds: body.coachIds,
      groupIds: body.groupIds,
      athleteIds: body.athleteIds,
      excludeSessionId: body.excludeSessionId,
    });
  }

  @Get('sessions/:id')
  async getSessionById(@Param('id') id: string) {
    return this.trainingPlanService.getSessionById(id);
  }

  @Put('sessions/:id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async updateSession(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.trainingPlanService.updateSession(id, dto);
  }

  @Put('sessions/:id/status')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async updateSessionStatus(@Param('id') id: string, @Body() dto: UpdateSessionStatusDto) {
    return this.trainingPlanService.updateSessionStatus(id, dto.status);
  }

  @Delete('sessions/:id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async deleteSession(@Param('id') id: string) {
    await this.trainingPlanService.deleteSession(id);
    return { message: '删除成功' };
  }
}
