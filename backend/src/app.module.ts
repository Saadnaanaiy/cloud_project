import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './attendance/attendance.entity';
import { AttendanceModule } from './attendance/attendance.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { Department } from './departments/department.entity';
import { DepartmentsModule } from './departments/departments.module';
import { Employee } from './employees/employee.entity';
import { EmployeesModule } from './employees/employees.module';
import { HealthModule } from './health/health.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'employee_db'),
        entities: [User, Employee, Department, Attendance],
        // Only auto-sync schema in development — in production use migrations
        synchronize: config.get<string>('NODE_ENV', 'development') !== 'production',
        logging: false,
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 30000,
        limit: 10,
      },
    ]),
    AuthModule,
    EmployeesModule,
    DepartmentsModule,
    AttendanceModule,
    ReportsModule,
    HealthModule,
  ],
})
export class AppModule {}
