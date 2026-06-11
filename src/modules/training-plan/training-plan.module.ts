import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingPlan } from '../../entities/training-plan.entity';
import { TrainingSession } from '../../entities/training-session.entity';
import { Team } from '../../entities/team.entity';
import { AthleteGroup } from '../../entities/athlete-group.entity';
import { User } from '../../entities/user.entity';
import { TrainingPlanService } from './training-plan.service';
import { TrainingPlanController } from './training-plan.controller';
import { AuthModule } from '../auth/auth.module';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrainingPlan, TrainingSession, Team, AthleteGroup, User]),
    AuthModule,
    TeamModule,
  ],
  providers: [TrainingPlanService],
  controllers: [TrainingPlanController],
  exports: [TrainingPlanService],
})
export class TrainingPlanModule {}
