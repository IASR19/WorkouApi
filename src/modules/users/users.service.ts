import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate } from '../../common/dto/paginated-result';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async findAll(pagination: PaginationQueryDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const [items, total] = await this.users.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });
    return paginate(items, total, page, limit);
  }

  findByEmail(email: string) {
    return this.users.findOne({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateProfile(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) throw new ConflictException('E-mail já está em uso.');
      user.email = dto.email;
    }

    if (dto.name) user.name = dto.name;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;

    if (dto.newPassword) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Informe a senha atual para definir uma nova senha.');
      }
      const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!matches) throw new BadRequestException('Senha atual incorreta.');
      user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    return this.users.save(user);
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
