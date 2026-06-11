import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../../entities/attendance.entity';
import { TrainingSession } from '../../entities/training-session.entity';
import { User } from '../../entities/user.entity';
import { AthleteGroup } from '../../entities/athlete-group.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AuthModule } from '../auth/auth.module';
import { TrainingPlanModule } from '../training-plan/training-plan.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, TrainingSession, User, AthleteGroup]),
    AuthModule,
    TrainingPlanModule,
  ],
  providers: [AttendanceService],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
