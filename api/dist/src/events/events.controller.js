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
exports.EventsController = void 0;
const common_1 = require("@nestjs/common");
const events_service_1 = require("./events.service");
const events_dto_1 = require("./dto/events.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const api_key_guard_1 = require("../auth/guards/api-key.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const auth_dto_1 = require("../auth/dto/auth.dto");
let EventsController = class EventsController {
    eventsService;
    constructor(eventsService) {
        this.eventsService = eventsService;
    }
    create(req, dto) {
        return this.eventsService.create(req.user.storeId, dto);
    }
    update(req, id, dto) {
        return this.eventsService.update(req.user.storeId, id, dto);
    }
    remove(req, id) {
        return this.eventsService.remove(req.user.storeId, id);
    }
    findAllAdmin(req) {
        return this.eventsService.findAll(req.user.storeId);
    }
    findAll(req) {
        return this.eventsService.findPublic(req.store.id);
    }
    findOne(req, id) {
        return this.eventsService.findOne(req.store.id, id);
    }
    register(req, id, dto) {
        return this.eventsService.registerPlayer(req.store.id, id, dto);
    }
};
exports.EventsController = EventsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(auth_dto_1.Role.ADMIN, auth_dto_1.Role.STAFF),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, events_dto_1.CreateEventDto]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(auth_dto_1.Role.ADMIN, auth_dto_1.Role.STAFF),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(auth_dto_1.Role.ADMIN, auth_dto_1.Role.STAFF),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('admin/list'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(auth_dto_1.Role.ADMIN, auth_dto_1.Role.STAFF),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "findAllAdmin", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/register'),
    (0, common_1.UseGuards)(api_key_guard_1.ApiKeyGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, events_dto_1.RegisterPlayerDto]),
    __metadata("design:returntype", void 0)
], EventsController.prototype, "register", null);
exports.EventsController = EventsController = __decorate([
    (0, common_1.Controller)('events'),
    __metadata("design:paramtypes", [events_service_1.EventsService])
], EventsController);
//# sourceMappingURL=events.controller.js.map