import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getNext(prefix: string): Promise<string> {
    const result = await this.prisma.$queryRaw<{ next_value: number }[]>`
      INSERT INTO sequences (id, prefix, next_value, updated_at)
      VALUES (gen_random_uuid(), ${prefix}, 2, NOW())
      ON CONFLICT (prefix)
      DO UPDATE SET next_value = sequences.next_value + 1, updated_at = NOW()
      RETURNING next_value - 1 as next_value
    `;

    const nextVal = result[0]?.next_value ?? 1;
    const padded = String(nextVal).padStart(6, '0');
    return `${prefix}-${padded}`;
  }
}
