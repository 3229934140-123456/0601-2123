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
  Request,
} from '@nestjs/common';
import { TestScoreService } from './test-score.service';
import { TestType } from '../../entities/test-score.entity';
import { UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
} from 'class-validator';

class CreateTestScoreDto {
  @IsString()
  athleteId: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsEnum(TestType)
  testType: TestType;

  @IsString()
  testName: string;

  @IsNumber()
  value: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsDateString()
  testDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

class UpdateTestScoreDto {
  @IsEnum(TestType)
  @IsOptional()
  testType?: TestType;

  @IsString()
  @IsOptional()
  testName?: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsDateString()
  @IsOptional()
  testDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

@Controller('test-scores')
@UseGuards(JwtAuthGuard)
export class TestScoreController {
  constructor(private testScoreService: TestScoreService) {}

  @Post()
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async create(@Body() dto: CreateTestScoreDto) {
    return this.testScoreService.create({
      ...dto,
      testDate: new Date(dto.testDate),
    });
  }

  @Post('batch')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async createBatch(@Body() dtos: CreateTestScoreDto[]) {
    return this.testScoreService.createBatch(
      dtos.map((d) => ({ ...d, testDate: new Date(d.testDate) })),
    );
  }

  @Get('types')
  async getTestTypes() {
    return this.testScoreService.getTestTypes();
  }

  @Get('athlete/:athleteId')
  async getAthleteScores(
    @Param('athleteId') athleteId: string,
    @Query('testType') testType?: TestType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.testScoreService.getAthleteScores(
      athleteId,
      testType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('my-scores')
  async getMyScores(
    @Request() req,
    @Query('testType') testType?: TestType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.testScoreService.getAthleteScores(
      req.user.sub,
      testType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('session/:sessionId')
  async getSessionScores(@Param('sessionId') sessionId: string) {
    return this.testScoreService.getSessionScores(sessionId);
  }

  @Get('athlete/:athleteId/progress')
  async getTestProgress(
    @Param('athleteId') athleteId: string,
    @Query('testName') testName: string,
    @Query('days') days?: number,
  ) {
    return this.testScoreService.getAthleteTestProgress(
      athleteId,
      testName,
      days ? parseInt(days as any, 10) : 90,
    );
  }

  @Get('my-progress')
  async getMyProgress(
    @Request() req,
    @Query('testName') testName: string,
    @Query('days') days?: number,
  ) {
    return this.testScoreService.getAthleteTestProgress(
      req.user.sub,
      testName,
      days ? parseInt(days as any, 10) : 90,
    );
  }

  @Get('athlete/:athleteId/latest')
  async getLatestScores(@Param('athleteId') athleteId: string) {
    return this.testScoreService.getAthleteLatestScores(athleteId);
  }

  @Get('my-latest')
  async getMyLatest(@Request() req) {
    return this.testScoreService.getAthleteLatestScores(req.user.sub);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.testScoreService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateTestScoreDto) {
    const updateData: any = { ...dto };
    if (dto.testDate) {
      updateData.testDate = new Date(dto.testDate);
    }
    return this.testScoreService.update(id, updateData);
  }

  @Delete(':id')
  @Roles(UserRole.COACH, UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    await this.testScoreService.delete(id);
    return { message: '删除成功' };
  }
}
