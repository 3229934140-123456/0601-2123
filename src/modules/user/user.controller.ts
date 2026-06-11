import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  weight?: number;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async findAll(@Query('role') role?: UserRole) {
    return this.userService.findAll(role);
  }

  @Get('athletes')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async getAthletes() {
    return this.userService.getAthletes();
  }

  @Get('coaches')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async getCoaches() {
    return this.userService.getCoaches();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    const { password, ...result } = user;
    return result;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.userService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.userService.delete(id);
    return { message: '删除成功' };
  }
}
