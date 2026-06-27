import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findAll() {
    return this.users.find({ order: { createdAt: 'DESC' } });
  }

  findByEmail(email: string) {
    return this.users.findOne({ where: { email } });
  }

  async create(dto: CreateUserDto) {
    const user = this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: dto.role,
      roles: [dto.role]
    });
    return this.users.save(user);
  }

  async addRole(userId: string, role: UserRole) {
    const user = await this.users.findOneByOrFail({ id: userId });
    const current = user.roles?.length ? user.roles : [user.role];
    if (!current.includes(role)) {
      user.roles = [...current, role];
    }
    return this.users.save(user);
  }

  getAvailableRoles(user: User): UserRole[] {
    const roles = user.roles?.length ? user.roles : [user.role];
    return [...new Set(roles)];
  }
}
