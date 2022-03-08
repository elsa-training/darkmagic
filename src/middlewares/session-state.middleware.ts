import { Optional, Singleton } from '@steffy/di';
import { TokenExpiredError, verify } from 'jsonwebtoken';

const JWT_HS256_HEADER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

const NOT_AUTHORIZED = {
  code: 401,
};
const TOKEN_EXPIRED = {
  code: 401,
};

@Singleton()
export class SessionStateMiddleware {
  constructor(@Optional('SteffyConfig') private config: any) {}

  public async authorize(ctx, next) {
    try {
      if (ctx.request.get('Authorization')) {
        const bearer = ctx.request.get('Authorization').split(' ')[1];
        const [jwtHeader, jwtPayload, jwtSignature] = bearer.split('.');
        if (jwtHeader !== JWT_HS256_HEADER) {
          throw NOT_AUTHORIZED;
        }
        const verified: any = verify(bearer, this.config.secret);
        if (verified) {
          ctx.session.user = verified.data;
          ctx.state.user = verified.data;
        }
      }
    } catch (err) {
      if (err?.code === NOT_AUTHORIZED.code) {
        throw err;
      }

      if (err instanceof TokenExpiredError) {
        throw TOKEN_EXPIRED;
      }
      // swallow
    }
    return next();
  }
}
