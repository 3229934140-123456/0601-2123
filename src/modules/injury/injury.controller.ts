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
import { InjuryService } from './injury.service';
import { InjuryStatus, InjurySeverity } from '../../entities/injury-record.entity';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsArray,
} from 'class-validator';

class CreateInjuryDto {
  @IsString()
  athleteId: string;

  @IsString()
  bodyPart: string;

  @IsString()
  injuryType: string;

  @IsEnum(InjurySeverity)
  severity: InjurySeverity;

  @IsDateString()
  injuryDate: string;

  @IsDateString()
  @IsOptional()
  expectedRecoveryDate?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  trainingLoadLimit?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  restrictedActivities?: string;
}

class UpdateInjuryDto {
  @IsString()
  @IsOptional()
  bodyPart?: string;

  @IsString()
  @IsOptional()
  injuryType?: string;

  @IsEnum(InjurySeverity)
  @IsOptional()
  severity?: InjurySeverity;

  @IsEnum(InjuryStatus)
  @IsOptional()
  status?: InjuryStatus;

  @IsDateString()
  @IsOptional()
  injuryDate?: string;

  @IsDateString()
  @IsOptional()
  expectedRecoveryDate?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  trainingLoadLimit?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  restrictedActivities?: string;
}

class UpdateStatusDto {
  @IsEnum(InjuryStatus)
  status: InjuryStatus;
}

@Controller('injuries')
@UseGuards(JwtAuthGuard)
export class InjuryController {
  constructor(private injuryService: InjuryService) {}

  @Post()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async create(@Body() dto: CreateInjuryDto) {
    return this.injuryService.create({
      ...dto,
      injuryDate: new Date(dto.injuryDate),
      expectedRecoveryDate: dto.expectedRecoveryDate
        ? new Date(dto.expectedRecoveryDate)
        : undefined,
    });
  }

  @Get('statuses')
  getStatuses() {
    return this.injuryService.getInjuryStatuses();
  }

  @Get('severities')
  getSeverities() {
    return this.injuryService.getInjurySeverities();
  }

  @Get('athlete/:athleteId')
  async getAthleteInjuries(
    @Param('athleteId') athleteId: string,
    @Query('status') status?: InjuryStatus,
  ) {
    return this.injuryService.getAthleteInjuries(athleteId, status);
  }

  @Get('my-injuries')
  async getMyInjuries(@Request() req, @Query('status') status?: InjuryStatus) {
    return this.injuryService.getAthleteInjuries(req.user.sub, status);
  }

  @Get('team-active')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async getTeamActiveInjuries(@Query('athleteIds') athleteIds: string) {
    const ids = athleteIds.split(',');
    return this.injuryService.getTeamActiveInjuries(ids);
  }

  @Get('load-limit/:athleteId')
  async getAthleteLoadLimit(@Param('athleteId') athleteId: string) {
    const limit = await this.injuryService.getAthleteLoadLimit(athleteId);
    return { athleteId, trainingLoadLimit: limit };
  }

  @Get('my-load-limit')
  async getMyLoadLimit(@Request() req) {
    const limit = await this.injuryService.getAthleteLoadLimit(req.user.sub);
    return { athleteId: req.user.sub, trainingLoadLimit: limit };
  }

  @Get('alerts/:athleteId')
  async getAthleteAlerts(
    @Param('athleteId') athleteId: string,
    @Query('athleteName') athleteName: string = '',
  ) {
    return this.injuryService.getAthleteFatigueAlerts(athleteId, athleteName);
  }

  @Get('my-alerts')
  async getMyAlerts(@Request() req) {
    return this.injuryService.getAthleteFatigueAlerts(req.user.sub, req.user.name || req.user.username);
  }

  @Get('team-alerts')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async getTeamAlerts(@Query('athleteIds') athleteIds: string) {
    const ids = athleteIds.split(',');
    const nameMap = new Map<string, string>();
    ids.forEach((id) => nameMap.set(id, id));
    return this.injuryService.getTeamFatigueAlerts(ids, nameMap);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.injuryService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateInjuryDto) {
    const updateData: any = { ...dto };
    if (dto.injuryDate) {
      updateData.injuryDate = new Date(dto.injuryDate);
    }
    if (dto.expectedRecoveryDate) {
      updateData.expectedRecoveryDate = new Date(dto.expectedRecoveryDate);
    }
    return this.injuryService.update(id, updateData);
  }

  @Put(':id/status')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.injuryService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.injuryService.delete(id);
    return { message: '删除成功' };
  }
}
