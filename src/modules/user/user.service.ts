import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findAll(role?: UserRole): Promise<User[]> {
    const where = role ? { role } : {};
    return this.userRepository.find({
      where,
      select: [
        'id',
        'username',
        'name',
        'role',
        'phone',
        'avatar',
        'birthday',
        'gender',
        'height',
        'weight',
        'createdAt',
      ],
    });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return this.userRepository.findBy({ id: In(ids) });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['teams', 'coachedTeams', 'injuries'],
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username })
      .getOne();
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, userData);
    await this.userRepository.save(user);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('用户不存在');
    }
  }

  async getAthletes(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.ATHLETE },
      select: [
        'id',
        'username',
        'name',
        'phone',
        'avatar',
        'birthday',
        'gender',
        'height',
        'weight',
      ],
    });
  }

  async getCoaches(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.COACH },
      select: ['id', 'username', 'name', 'phone', 'avatar'],
    });
  }
}
