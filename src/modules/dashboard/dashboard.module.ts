import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../../entities/team.entity';
import { User } from '../../entities/user.entity';
import { TrainingSession } from '../../entities/training-session.entity';
import { Attendance } from '../../entities/attendance.entity';
import { AthleteGroup } from '../../entities/athlete-group.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { AuthModule } from '../auth/auth.module';
import { TrainingPlanModule } from '../training-plan/training-plan.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, User, TrainingSession, Attendance, AthleteGroup]),
    AuthModule,
    TrainingPlanModule,
    AttendanceModule,
    TeamModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
