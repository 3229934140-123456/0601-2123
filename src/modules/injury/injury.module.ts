import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjuryRecord } from '../../entities/injury-record.entity';
import { User } from '../../entities/user.entity';
import { LoadRecord } from '../../entities/load-record.entity';
import { InjuryService } from './injury.service';
import { InjuryController } from './injury.controller';
import { AuthModule } from '../auth/auth.module';
import { LoadRecordModule } from '../load-record/load-record.module';

@Module({
  imports: [TypeOrmModule.forFeature([InjuryRecord, User, LoadRecord]), AuthModule, LoadRecordModule],
  providers: [InjuryService],
  controllers: [InjuryController],
  exports: [InjuryService],
})
export class InjuryModule {}
