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
import { ExerciseService } from './exercise.service';
import { ExerciseCategory, EquipmentType } from '../../entities/exercise.entity';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';

class CreateExerciseDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ExerciseCategory)
  category: ExerciseCategory;

  @IsEnum(EquipmentType)
  @IsOptional()
  equipment?: EquipmentType;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @IsOptional()
  targetMuscles?: string[];

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

class UpdateExerciseDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ExerciseCategory)
  @IsOptional()
  category?: ExerciseCategory;

  @IsEnum(EquipmentType)
  @IsOptional()
  equipment?: EquipmentType;

  @IsString()
  @IsOptional()
  instructions?: string;

  @IsString()
  @IsOptional()
  videoUrl?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @IsOptional()
  targetMuscles?: string[];

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}

@Controller('exercises')
@UseGuards(JwtAuthGuard)
export class ExerciseController {
  constructor(private exerciseService: ExerciseService) {}

  @Post()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async create(@Body() dto: CreateExerciseDto) {
    return this.exerciseService.create(dto);
  }

  @Get()
  async findAll(
    @Query('category') category?: ExerciseCategory,
    @Query('equipment') equipment?: EquipmentType,
    @Query('keyword') keyword?: string,
  ) {
    return this.exerciseService.findAll(category, equipment, keyword);
  }

  @Get('categories')
  async getCategories() {
    return this.exerciseService.getCategories();
  }

  @Get('equipment-types')
  async getEquipmentTypes() {
    return this.exerciseService.getEquipmentTypes();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.exerciseService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.exerciseService.delete(id);
    return { message: '删除成功' };
  }
}
