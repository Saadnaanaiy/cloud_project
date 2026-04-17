import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private service: EmployeesService) {}

  // ── READ — all authenticated roles ───────────────────────────────────────────
  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: number,
  ) {
    return this.service.findAll(search, status, departmentId);
  }

  @Get('stats')
  getStats() { return this.service.getStats(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(+id); }

  // ── WRITE — Admin & HR only ──────────────────────────────────────────────────
  @Post()
  @Roles(UserRole.ADMIN, UserRole.HR)
  create(@Body() body: any) { return this.service.create(body); }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.HR)
  update(@Param('id') id: string, @Body() body: any) { return this.service.update(+id, body); }

  // ── DELETE / BLOCK — Admin only ──────────────────────────────────────────────
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) { return this.service.remove(+id); }

  @Patch(':id/block')
  @Roles(UserRole.ADMIN)
  block(@Param('id') id: string) { return this.service.block(+id); }

  @Patch(':id/unblock')
  @Roles(UserRole.ADMIN)
  unblock(@Param('id') id: string) { return this.service.unblock(+id); }
}
