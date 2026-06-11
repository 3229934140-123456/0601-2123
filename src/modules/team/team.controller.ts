import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsString, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';

class CreateTeamDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  sportType?: string;
}

class UpdateTeamDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  @IsOptional()
  sportType?: string;
}

class CoachIdDto {
  @IsString()
  coachId: string;
}

class AthleteIdsDto {
  @IsArray()
  @ArrayNotEmpty()
  athleteIds: string[];
}

class CreateGroupDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Post()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async create(@Body() dto: CreateTeamDto, @Request() req) {
    return this.teamService.create(dto, req.user.sub);
  }

  @Get()
  async findAll(@Request() req) {
    return this.teamService.findAll(req.user.sub, req.user.role);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.teamService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.teamService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.teamService.delete(id);
    return { message: '删除成功' };
  }

  @Post(':id/coaches')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async addCoach(@Param('id') id: string, @Body() dto: CoachIdDto) {
    return this.teamService.addCoach(id, dto.coachId);
  }

  @Delete(':id/coaches/:coachId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async removeCoach(@Param('id') id: string, @Param('coachId') coachId: string) {
    return this.teamService.removeCoach(id, coachId);
  }

  @Post(':id/athletes')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async addAthletes(@Param('id') id: string, @Body() dto: AthleteIdsDto) {
    return this.teamService.addAthletes(id, dto.athleteIds);
  }

  @Delete(':id/athletes/:athleteId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async removeAthlete(@Param('id') id: string, @Param('athleteId') athleteId: string) {
    return this.teamService.removeAthlete(id, athleteId);
  }

  @Post(':id/groups')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async createGroup(@Param('id') id: string, @Body() dto: CreateGroupDto) {
    return this.teamService.createGroup(id, dto);
  }

  @Get(':id/groups')
  async getGroups(@Param('id') id: string) {
    return this.teamService.getGroups(id);
  }

  @Put('groups/:groupId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async updateGroup(@Param('groupId') groupId: string, @Body() dto: CreateGroupDto) {
    return this.teamService.updateGroup(groupId, dto);
  }

  @Delete('groups/:groupId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async deleteGroup(@Param('groupId') groupId: string) {
    await this.teamService.deleteGroup(groupId);
    return { message: '删除成功' };
  }

  @Post('groups/:groupId/athletes')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async addAthletesToGroup(@Param('groupId') groupId: string, @Body() dto: AthleteIdsDto) {
    return this.teamService.addAthletesToGroup(groupId, dto.athleteIds);
  }

  @Delete('groups/:groupId/athletes/:athleteId')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async removeAthleteFromGroup(
    @Param('groupId') groupId: string,
    @Param('athleteId') athleteId: string,
  ) {
    return this.teamService.removeAthleteFromGroup(groupId, athleteId);
  }
}
