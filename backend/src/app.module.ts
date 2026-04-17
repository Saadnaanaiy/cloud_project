import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { DepartmentsModule } from './departments/departments.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ReportsModule } from './reports/reports.module';
import { User } from './auth/user.entity';
import { Employee } from './employees/employee.entity';
import { Department } from './departments/department.entity';
import { Attendance } from './attendance/attendance.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'employee_db',
      entities: [User, Employee, Department, Attendance],
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    EmployeesModule,
    DepartmentsModule,
    AttendanceModule,
    ReportsModule,
  ],
})
export class AppModule {}
