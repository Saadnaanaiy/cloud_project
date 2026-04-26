import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  OnModuleInit,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  async seedAdminUser() {
    const exists = await this.userRepo.findOne({
      where: { email: 'admin@company.com' },
    });
    if (!exists) {
      const hashed = await bcrypt.hash('admin123', 10);
      await this.userRepo.save([
        {
          name: 'Super Admin',
          email: 'admin@company.com',
          password: hashed,
          role: UserRole.ADMIN,
        },
        {
          name: 'HR Manager',
          email: 'hr@company.com',
          password: await bcrypt.hash('hr123', 10),
          role: UserRole.HR,
        },
        {
          name: 'Department Manager',
          email: 'manager@company.com',
          password: await bcrypt.hash('manager123', 10),
          role: UserRole.MANAGER,
        },
      ]);
      console.log('✅ Default users seeded: admin@company.com / admin123');
    }
  }

  async login(dto: LoginDto) {
    // 1. Verify CAPTCHA
    const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${dto.captchaToken}`;
    const captchaRes = await fetch(verifyUrl, { method: 'POST' });
    const captchaData = await captchaRes.json();
    if (!captchaData.success) {
      throw new BadRequestException('Invalid CAPTCHA token');
    }

    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepo.save({
      name: dto.name,
      email: dto.email,
      password: hashed,
      role: dto.role ?? UserRole.HR,
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: number,
    data: { name?: string; email?: string; password?: string },
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (data.email && data.email !== user.email) {
      const exists = await this.userRepo.findOne({
        where: { email: data.email },
      });
      if (exists) throw new ConflictException('Email already in use');
      user.email = data.email;
    }
    if (data.name) user.name = data.name;
    if (data.password) user.password = await bcrypt.hash(data.password, 10);

    const saved = await this.userRepo.save(user);
    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
    };
  }
}
