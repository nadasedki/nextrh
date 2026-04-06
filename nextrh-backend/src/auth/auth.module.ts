import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { jwtConstants } from './constants';
@Module({
   imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.register({
      secret:jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expiresIn },
    }),
  ],
  providers: [AuthService,JwtStrategy],
  controllers: [AuthController]
  , exports: [AuthService]
})
export class AuthModule {}
