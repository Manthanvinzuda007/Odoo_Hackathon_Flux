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
exports.UpdateQuotationStatusDto = exports.CreateQuotationDto = exports.QuotationLineDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class QuotationLineDto {
    description;
    quantity;
    unitPricePaise;
    taxId;
    taxRate;
}
exports.QuotationLineDto = QuotationLineDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Line item description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], QuotationLineDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantity', default: 1 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QuotationLineDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unit price in paise' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], QuotationLineDto.prototype, "unitPricePaise", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tax ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QuotationLineDto.prototype, "taxId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tax rate in basis points (e.g., 1800 for 18%)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], QuotationLineDto.prototype, "taxRate", void 0);
class CreateQuotationDto {
    customerId;
    templateId;
    notes;
    expiresAt;
    discountPaise;
    lines;
}
exports.CreateQuotationDto = CreateQuotationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Customer ID' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "customerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Template ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "templateId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Notes or terms' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quotation expiry date (ISO 8601)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "expiresAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Discount in paise' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateQuotationDto.prototype, "discountPaise", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quotation lines', type: [QuotationLineDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => QuotationLineDto),
    __metadata("design:type", Array)
], CreateQuotationDto.prototype, "lines", void 0);
class UpdateQuotationStatusDto {
    status;
}
exports.UpdateQuotationStatusDto = UpdateQuotationStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.QuotationStatus, description: 'New quotation status' }),
    (0, class_validator_1.IsEnum)(client_1.QuotationStatus),
    __metadata("design:type", String)
], UpdateQuotationStatusDto.prototype, "status", void 0);
//# sourceMappingURL=quotation.dto.js.map