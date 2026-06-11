import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Team } from '../../entities/team.entity';
import { AthleteGroup } from '../../entities/athlete-group.entity';
import { User, UserRole } from '../../entities/user.entity';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private teamRepository: Repository<Team>,
    @InjectRepository(AthleteGroup)
    private groupRepository: Repository<AthleteGroup>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(teamData: Partial<Team>, coachId: string): Promise<Team> {
    const coach = await this.userRepository.findOne({ where: { id: coachId } });
    if (!coach || coach.role !== UserRole.COACH) {
      throw new BadRequestException('教练不存在或角色不正确');
    }

    const team = this.teamRepository.create(teamData);
    team.coaches = [coach];
    await this.teamRepository.save(team);
    return this.findById(team.id);
  }

  async findAll(userId?: string, role?: UserRole): Promise<Team[]> {
    if (userId && role === UserRole.COACH) {
      const coachTeams = await this.teamRepository
        .createQueryBuilder('team')
        .innerJoin('team.coaches', 'filter_coach', 'filter_coach.id = :userId', { userId })
        .leftJoinAndSelect('team.coaches', 'coaches')
        .leftJoinAndSelect('team.athletes', 'athletes')
        .leftJoinAndSelect('team.groups', 'groups')
        .getMany();
      return coachTeams;
    }

    if (userId && role === UserRole.ATHLETE) {
      const athleteTeams = await this.teamRepository
        .createQueryBuilder('team')
        .innerJoin('team.athletes', 'filter_athlete', 'filter_athlete.id = :userId', { userId })
        .leftJoinAndSelect('team.coaches', 'coaches')
        .leftJoinAndSelect('team.athletes', 'athletes')
        .leftJoinAndSelect('team.groups', 'groups')
        .getMany();
      return athleteTeams;
    }

    return this.teamRepository.find({
      relations: ['coaches', 'athletes', 'groups'],
    });
  }

  async findById(id: string): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id },
      relations: ['coaches', 'athletes', 'groups', 'groups.athletes'],
    });
    if (!team) {
      throw new NotFoundException('队伍不存在');
    }
    return team;
  }

  async update(id: string, teamData: Partial<Team>): Promise<Team> {
    const team = await this.findById(id);
    Object.assign(team, teamData);
    await this.teamRepository.save(team);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.teamRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('队伍不存在');
    }
  }

  async addCoach(teamId: string, coachId: string): Promise<Team> {
    const team = await this.findById(teamId);
    const coach = await this.userRepository.findOne({ where: { id: coachId } });
    if (!coach || coach.role !== UserRole.COACH) {
      throw new BadRequestException('教练不存在或角色不正确');
    }

    if (!team.coaches.find(c => c.id === coachId)) {
      team.coaches.push(coach);
      await this.teamRepository.save(team);
    }
    return this.findById(teamId);
  }

  async removeCoach(teamId: string, coachId: string): Promise<Team> {
    const team = await this.findById(teamId);
    team.coaches = team.coaches.filter(c => c.id !== coachId);
    await this.teamRepository.save(team);
    return this.findById(teamId);
  }

  async addAthletes(teamId: string, athleteIds: string[]): Promise<Team> {
    const team = await this.findById(teamId);
    const athletes = await this.userRepository.findBy({
      id: In(athleteIds),
      role: UserRole.ATHLETE,
    });

    const existingIds = team.athletes.map(a => a.id);
    athletes.forEach(athlete => {
      if (!existingIds.includes(athlete.id)) {
        team.athletes.push(athlete);
      }
    });

    await this.teamRepository.save(team);
    return this.findById(teamId);
  }

  async removeAthlete(teamId: string, athleteId: string): Promise<Team> {
    const team = await this.findById(teamId);
    team.athletes = team.athletes.filter(a => a.id !== athleteId);
    await this.teamRepository.save(team);
    return this.findById(teamId);
  }

  async createGroup(teamId: string, groupData: Partial<AthleteGroup>): Promise<AthleteGroup> {
    const team = await this.findById(teamId);
    const group = this.groupRepository.create({
      ...groupData,
      teamId: team.id,
    });
    return this.groupRepository.save(group);
  }

  async getGroups(teamId: string): Promise<AthleteGroup[]> {
    return this.groupRepository.find({
      where: { teamId },
      relations: ['athletes'],
    });
  }

  async updateGroup(groupId: string, groupData: Partial<AthleteGroup>): Promise<AthleteGroup> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['athletes'],
    });
    if (!group) {
      throw new NotFoundException('分组不存在');
    }
    Object.assign(group, groupData);
    return this.groupRepository.save(group);
  }

  async deleteGroup(groupId: string): Promise<void> {
    const result = await this.groupRepository.delete(groupId);
    if (result.affected === 0) {
      throw new NotFoundException('分组不存在');
    }
  }

  async addAthletesToGroup(groupId: string, athleteIds: string[]): Promise<AthleteGroup> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['athletes'],
    });
    if (!group) {
      throw new NotFoundException('分组不存在');
    }

    const athletes = await this.userRepository.findBy({
      id: In(athleteIds),
      role: UserRole.ATHLETE,
    });

    const existingIds = group.athletes.map(a => a.id);
    athletes.forEach(athlete => {
      if (!existingIds.includes(athlete.id)) {
        group.athletes.push(athlete);
      }
    });

    return this.groupRepository.save(group);
  }

  async removeAthleteFromGroup(groupId: string, athleteId: string): Promise<AthleteGroup> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['athletes'],
    });
    if (!group) {
      throw new NotFoundException('分组不存在');
    }
    group.athletes = group.athletes.filter(a => a.id !== athleteId);
    return this.groupRepository.save(group);
  }
}
