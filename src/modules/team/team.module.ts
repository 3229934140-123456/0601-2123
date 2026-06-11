import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from '../../entities/team.entity';
import { AthleteGroup } from '../../entities/athlete-group.entity';
import { User } from '../../entities/user.entity';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Team, AthleteGroup, User]), AuthModule, UserModule],
  providers: [TeamService],
  controllers: [TeamController],
  exports: [TeamService],
})
export class TeamModule {}
