"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    console.log('--- ENV DEBUG ---');
    console.log('MANAPOOL_ACCESS_TOKEN:', process.env.MANAPOOL_ACCESS_TOKEN ? 'DEFINED (Masked)' : 'MISSING');
    console.log('Available Env Keys:', Object.keys(process.env).sort().join(', '));
    console.log('--- ENV DEBUG ---');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    app.enableCors({
        origin: [
            'http://localhost:3000',
            'https://rng-game-backend-production.up.railway.app',
            'https://rng-game-backend.vercel.app',
            'https://rng-gamez-shop.vercel.app',
            'http://localhost:3002',
            /https:\/\/.*\.onrender\.com/,
            /https:\/\/.*\.vercel\.app/
        ],
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization, x-api-key',
    });
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('TCG SaaS API')
        .setDescription('The multi-tenant TCG platform API')
        .setVersion('1.0')
        .addBearerAuth()
        .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/', (req, res) => {
        res.send({ status: 'ok', message: 'TCG Backend is running (v1.2 - Filters Enabled)' });
    });
    const port = process.env.PORT || 3001;
    await app.listen(port, '0.0.0.0');
    const server = app.getHttpServer();
    const address = server.address();
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log(`Server bound to:`, address);
}
bootstrap();
//# sourceMappingURL=main.js.map