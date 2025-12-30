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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuylistController = void 0;
const common_1 = require("@nestjs/common");
const buylist_service_1 = require("./buylist.service");
const buylist_dto_1 = require("./dto/buylist.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const api_key_guard_1 = require("../auth/guards/api-key.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const auth_dto_1 = require("../auth/dto/auth.dto");
let BuylistController = class BuylistController {
    buylistService;
    constructor(buylistService) {
        this.buylistService = buylistService;
    }
    createRule(req, dto) {
        return this.buylistService.createRule(req.user.storeId, dto);
    }
    getRules(req) {
        return this.buylistService.getRules(req.user.storeId);
    }
    getOffers(req) {
        return this.buylistService.getOffers(req.user.storeId);
    }
    updateOffer(req, id, dto) {
        return this.buylistService.updateOfferStatus(req.user.storeId, id, dto);
    }
    submitOffer(req, dto) {
        return this.buylistService.submitOffer(req.store.id, dto);
    }
};
exports.BuylistController = BuylistController;
__decorate([
    (0, common_1.Post)('rules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(auth_dto_1.Role.ADMIN),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, buylist_dto_1.CreateBuylistRuleDto]),
    __metadata("design:returntype", void 0)
], BuylistController.prototype, "createRule", null);
__decorate([
    (0, common_1.Get)('rules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(auth_dto_1.Role.ADMIN, auth_dto_1.Role.STAFF),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BuylistController.prototype, "getRules", null);
__decorate([
    (0, common_1.Get)('offers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(auth_dto_1.Role.ADMIN, auth_dto_1.Role.STAFF),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BuylistController.prototype, "getOffers", null);
__decorate([
    (0, common_1.Patch)('offers/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(auth_dto_1.Role.ADMIN, auth_dto_1.Role.STAFF),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, buylist_dto_1.UpdateOfferStatusDto]),
    __metadata("design:returntype", void 0)
], BuylistController.prototype, "updateOffer", null);
__decorate([
    (0, common_1.Post)('offers'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, buylist_dto_1.CreateBuylistOfferDto]),
    __metadata("design:returntype", void 0)
], BuylistController.prototype, "submitOffer", null);
exports.BuylistController = BuylistController = __decorate([
    (0, common_1.Controller)('buylist'),
    __metadata("design:paramtypes", [buylist_service_1.BuylistService])
], BuylistController);
//# sourceMappingURL=buylist.controller.js.map