import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('team/:teamId')
  async getTeamDashboard(
    @Param('teamId') teamId: string,
    @Query('date') date?: string,
  ) {
    return this.dashboardService.getDashboardForTeam(teamId, date);
  }

  @Get('next-training')
  async getNextTrainingReminder(@Request() req) {
    return this.dashboardService.getNextTrainingReminder(req.user.sub);
  }

  @Get('upcoming')
  async getUpcomingTrainings(
    @Request() req,
    @Query('days') days?: number,
  ) {
    return this.dashboardService.getUpcomingTrainings(
      req.user.sub,
      days ? parseInt(days as any, 10) : 7,
    );
  }

  @Get('daily-briefing')
  async getDailyBriefing(@Request() req) {
    return this.dashboardService.getAthleteDailyBriefing(req.user.sub);
  }

  @Get('big-screen/:teamId')
  async getBigScreenData(
    @Param('teamId') teamId: string,
    @Query('date') date?: string,
  ) {
    return this.dashboardService.getDashboardForTeam(teamId, date);
  }

  @Get('weekly-calendar')
  async getWeeklyCalendar(
    @Request() req,
    @Query('teamId') teamId?: string,
    @Query('coachId') coachId?: string,
    @Query('groupId') groupId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const viewerCoachId = req.user?.role === UserRole.COACH ? req.user.sub : undefined;
    return this.dashboardService.getWeeklyCalendar({
      teamId,
      coachId,
      groupId,
      startDate,
      endDate,
      viewerCoachId,
    });
  }

  @Get('weekly-calendar/:teamId')
  async getTeamWeeklyCalendar(
    @Request() req,
    @Param('teamId') teamId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const viewerCoachId = req.user?.role === UserRole.COACH ? req.user.sub : undefined;
    return this.dashboardService.getWeeklyCalendar({
      teamId,
      startDate,
      endDate,
      viewerCoachId,
    });
  }
}
