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
}
