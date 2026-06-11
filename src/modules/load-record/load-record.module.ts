import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoadRecord } from '../../entities/load-record.entity';
import { TrainingSession } from '../../entities/training-session.entity';
import { User } from '../../entities/user.entity';
import { Exercise } from '../../entities/exercise.entity';
import { LoadRecordService } from './load-record.service';
import { LoadRecordController } from './load-record.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([LoadRecord, TrainingSession, User, Exercise]), AuthModule],
  providers: [LoadRecordService],
  controllers: [LoadRecordController],
  exports: [LoadRecordService],
})
export class LoadRecordModule {}
