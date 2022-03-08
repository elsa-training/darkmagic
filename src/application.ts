import { DatabasePlugin } from '@steffy/db';
import { Inject, Optional, Singleton } from '@steffy/di';
import { HttpServerPlugin } from '@steffy/http';
import { GelfLoggerPlugin } from './plugins/gelf-logger.plugin';
import { SessionStateMiddleware } from './middlewares/session-state.middleware';

@Singleton()
export class Application {
  constructor(
    @Inject('logger') private logger: GelfLoggerPlugin,
    @Inject() private server: HttpServerPlugin,
    @Optional('SteffyConfig') private config: any,
    @Inject() private ssm: SessionStateMiddleware,
    @Inject() private db: DatabasePlugin
  ) {}

  public async start() {
    this.config.cwd = __dirname;

    // Authorization middleware
    await this.server.warmup([
      async (ctx, next) => {
        if (ctx.request.url.toString().startsWith('/api')) {
          // only api calls should fail
          try {
            return await this.ssm.authorize(ctx, next);
          } catch (err) {
            ctx.status = err.errorCode;
            ctx.body = err;
          }
        }
      },
    ]);

    this.server.listen();
    this.logger.info(Application.name, `Started and listening on ${this.config.settings.port}`);
  }
}
