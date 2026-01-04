"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const store_module_1 = require("./store/store.module");
const public_module_1 = require("./public/public.module");
const products_module_1 = require("./products/products.module");
const inventory_module_1 = require("./inventory/inventory.module");
const buylist_module_1 = require("./buylist/buylist.module");
const orders_module_1 = require("./orders/orders.module");
const customers_module_1 = require("./customers/customers.module");
const events_module_1 = require("./events/events.module");
const analytics_module_1 = require("./analytics/analytics.module");
const integrations_module_1 = require("./integrations/integrations.module");
const uploads_module_1 = require("./uploads/uploads.module");
const categories_module_1 = require("./categories/categories.module");
const prisma_module_1 = require("./prisma/prisma.module");
const manapool_module_1 = require("./integrations/manapool/manapool.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, users_module_1.UsersModule, store_module_1.StoreModule, public_module_1.PublicModule, products_module_1.ProductsModule, inventory_module_1.InventoryModule, buylist_module_1.BuylistModule, orders_module_1.OrdersModule, customers_module_1.CustomersModule, events_module_1.EventsModule, analytics_module_1.AnalyticsModule, integrations_module_1.IntegrationsModule, uploads_module_1.UploadsModule, categories_module_1.CategoriesModule, prisma_module_1.PrismaModule, manapool_module_1.ManapoolModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map