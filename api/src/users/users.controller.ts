import { Controller, Get, UseGuards, Request, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    findAll(@Request() req) {
        return this.usersService.findAll(req.user.storeId);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Request() req) {
        return this.usersService.findOne(id, req.user.storeId);
    }
}
