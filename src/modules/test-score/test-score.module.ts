import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestScore } from '../../entities/test-score.entity';
import { User } from '../../entities/user.entity';
import { TrainingSession } from '../../entities/training-session.entity';
import { TestScoreService } from './test-score.service';
import { TestScoreController } from './test-score.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([TestScore, User, TrainingSession]), AuthModule],
  providers: [TestScoreService],
  controllers: [TestScoreController],
  exports: [TestScoreService],
})
export class TestScoreModule {}
