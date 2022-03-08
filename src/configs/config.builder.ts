import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const typeorm = {
  useUnifiedTopology: true,
  synchronize: false,
  migration: true,
  consistencyFix: true,
  logging: false,
  entities: ['src/models/**/*.entity.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  cli: {
    entitiesDir: 'src/models',
    migrationsDir: 'src/migrations',
    subscribersDir: 'src/subscribers',
  },
};

const mailer = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'username',
    pass: 'password',
  },
  tls: {
    rejectUnauthorized: true,
  },
};

const log = {
  useGelf: false,
  namespace: 'sandbox',
  host: 'localhost',
  useTcp: true,
  portUdp: 12201,
  portTcp: 12201,
};

const redis = {
  host: 'localhost',
  port: 6379,
};

class ConfigBuilder {
  constructor() {
    config();
    let cfg: any = {};
    cfg.appVersion = process.env.APP_VERSION;
    cfg.gitCommit = process.env.GIT_COMMIT;
    const configPath = resolve(__dirname, 'steffy-config.config.json');
    try {
      cfg = Object.assign(
        {},
        cfg,
        JSON.parse(readFileSync(configPath).toString())
      );
    } catch (err) {}
    cfg = Object.assign({}, cfg, {
      secret: process.env.SECRET || cfg.secret,
      sessionKey: process.env.SESSION_KEY || cfg.sessionKey,
      settings: Object.assign({}, cfg.settings, {
        port: parseInt(process.env.PORT, 10),
        listeningPort: parseInt(process.env.LISTENING_PORT, 10),
        host: process.env.HOST,
        ip: process.env.IP,
        saUser: process.env.SA_USER,
        saPass: process.env.SA_PASS,
      }),
      mailer: Object.assign({}, mailer, cfg.mailer, {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure:
          (process.env.SMTP_PORT ||
            (mailer.secure as boolean).toString() ||
            'false') === 'true',
        auth: Object.assign({}, mailer ? mailer.auth : {}, {
          user: process.env.SMTP_USER || mailer.auth.user,
          pass: process.env.SMTP_PASS || mailer.auth.pass,
        }),
        tls: {
          rejectUnauthorized:
            (process.env.SMTP_REJECT_UNAUTHORIZED?.toString() || 'false') ===
            'true',
        },
      }),
      path: process.env.PUBLIC || cfg.path || './public',
      useSwagger:
        (process.env.SWAGGER ||
          (cfg && cfg.useSwagger as boolean)?.toString() ||
          'false') === 'true',
      typeorm: Object.assign({}, cfg.typeorm || {}, typeorm, {
        host: process.env.DB_HOST,
        type: process.env.DB_TYPE,
        url: process.env.DB_URL,
        port: process.env.DB_PORT,
        database: process.env.DB_DATABASE,
        authSource: process.env.DB_AUTH_SOURCE,
        ssl:
          (process.env.DB_SSL ||
            (cfg&&cfg.typeorm?.ssl as boolean)?.toString() ||
            'false') === 'true',
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        migration: process.env.DB_RUN_MIGRATIONS === 'true',
        consistencyFix: process.env.DB_RUN_CONSISTENCY_FIX === 'true',
      }),
      log: Object.assign({}, log, cfg.log, {
        useGelf: process.env.LOG_GELF_ENABLED === 'true',
        namespace: process.env.LOG_K8S_NAMESPACE,
        host: process.env.LOG_HOST,
        useTcp: process.env.LOG_USE_TCP === 'true',
        port:
          process.env.LOG_USE_TCP === 'true'
            ? parseInt(process.env.LOG_PORT_TCP, 10)
            : parseInt(process.env.LOG_PORT_UDP, 10),
        portUdp: parseInt(process.env.LOG_PORT_UDP, 10),
        portTcp: parseInt(process.env.LOG_PORT_TCP, 10),
      }),
      redis: Object.assign({}, redis, cfg.redis, {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT_TCP, 10),
      }),
      fileUploadLimits: {
        image: parseInt(process.env.UPLOAD_IMAGE_MAX_SIZE, 10),
        video: parseInt(process.env.UPLOAD_VIDEO_MAX_SIZE, 10),
        common: parseInt(process.env.UPLOAD_COMMON_MAX_SIZE, 10),
      },
      uploadDir: process.env.UPLOAD_DIR,
    });
    writeFileSync(configPath, JSON.stringify(cfg, null, 2));
  }
}

new ConfigBuilder();
