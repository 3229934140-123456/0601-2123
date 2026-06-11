import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from '../../entities/exercise.entity';
import { ExerciseService } from './exercise.service';
import { ExerciseController } from './exercise.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise]), AuthModule],
  providers: [ExerciseService],
  controllers: [ExerciseController],
  exports: [ExerciseService],
})
export class ExerciseModule {}
