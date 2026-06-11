import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { User, UserRole } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    return this.generateToken(user as User);
  }

  async register(
    username: string,
    password: string,
    name: string,
    role: UserRole = UserRole.ATHLETE,
    extraData?: Partial<User>,
  ) {
    const existingUser = await this.userService.findByUsername(username);
    if (existingUser) {
      throw new BadRequestException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.create({
      username,
      password: hashedPassword,
      name,
      role,
      ...extraData,
    });

    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    };
  }
}
