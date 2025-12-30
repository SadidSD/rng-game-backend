"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EbayService = void 0;
const common_1 = require("@nestjs/common");
let EbayService = class EbayService {
    async syncInventory(storeId) {
        console.log(`[eBay] Syncing inventory for store ${storeId}...`);
        return { success: true, message: 'Inventory sync started' };
    }
    async importOrders(storeId) {
        console.log(`[eBay] Importing orders for store ${storeId}...`);
        return { success: true, count: 0 };
    }
};
exports.EbayService = EbayService;
exports.EbayService = EbayService = __decorate([
    (0, common_1.Injectable)()
], EbayService);
//# sourceMappingURL=ebay.service.js.map