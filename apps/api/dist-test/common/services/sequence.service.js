"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequenceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SequenceService = class SequenceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getNext(prefix) {
        const result = await this.prisma.$queryRaw `
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
};
exports.SequenceService = SequenceService;
exports.SequenceService = SequenceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SequenceService);
//# sourceMappingURL=sequence.service.js.map