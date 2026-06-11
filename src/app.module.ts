import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TeamModule } from './modules/team/team.module';
import { TrainingPlanModule } from './modules/training-plan/training-plan.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { LoadRecordModule } from './modules/load-record/load-record.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { TestScoreModule } from './modules/test-score/test-score.module';
import { InjuryModule } from './modules/injury/injury.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { User } from './entities/user.entity';
import { Team } from './entities/team.entity';
import { AthleteGroup } from './entities/athlete-group.entity';
import { TrainingPlan } from './entities/training-plan.entity';
import { TrainingSession } from './entities/training-session.entity';
import { Exercise } from './entities/exercise.entity';
import { LoadRecord } from './entities/load-record.entity';
import { Attendance } from './entities/attendance.entity';
import { TestScore } from './entities/test-score.entity';
import { InjuryRecord } from './entities/injury-record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: parseInt(configService.get('DB_PORT', '5432'), 10),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'smart_sports'),
        entities: [
          User,
          Team,
          AthleteGroup,
          TrainingPlan,
          TrainingSession,
          Exercise,
          LoadRecord,
          Attendance,
          TestScore,
          InjuryRecord,
        ],
        synchronize: true,
        logging: false,
      }),
    }),
    AuthModule,
    UserModule,
    TeamModule,
    TrainingPlanModule,
    ExerciseModule,
    LoadRecordModule,
    AttendanceModule,
    TestScoreModule,
    InjuryModule,
    DashboardModule,
  ],
})
export class AppModule {}
