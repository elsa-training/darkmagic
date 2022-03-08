import { ILogger, IPlugin } from '@steffy/core';
import { Optional, Override, Singleton } from '@steffy/di';
import dgram = require('dgram');
import tcp = require('net');

enum Severity {
  EMERGENCY,
  ALERT,
  CRITICAL,
  ERROR,
  WARNING,
  NOTICE,
  INFORMATION,
  DEBUG,
}

@Override
@Singleton('Logger')
export class GelfLoggerPlugin implements ILogger, IPlugin {
  pluginName: string = 'Logger';
  private _clientUdp: dgram.Socket;
  private _clientTcp: tcp.Socket;

  constructor(@Optional('SteffyConfig') private config: any) {}

  get clientUdp(): dgram.Socket {
    if (this._clientUdp == null) {
      this._clientUdp = dgram.createSocket('udp4');
      this._clientUdp.on('error', () => {
        this._clientUdp.close();
        this._clientUdp = null;
      });
    }
    return this._clientUdp;
  }

  private sendUdp(msg: Buffer | string | Uint8Array[]) {
    this.clientUdp.send(
      msg,
      this.config.log.port,
      this.config.log.host,
      (err, bytes) => {
        if (err) {
          this.clientUdp.close(); // reset and force new connection
          this._clientUdp = null;
        }
      }
    );
  }

  get clientTcp(): tcp.Socket {
    if (this._clientTcp == null) {
      this._clientTcp = tcp.connect(
        this.config.log.port,
        this.config.log.host,
        () => {
          this._clientTcp.on('error', (e) => {
            console.error(e);
            this.clientTcp.destroy(); // reset and force new connection
            this._clientTcp = null;
          });
        }
      );
    }
    return this._clientTcp;
  }

  private sendTcp(buffer: Buffer) {
    this.clientTcp.write(buffer);
  }

  emergency(module: string, ...messages: any[]) {
    this.sendToGraylog(module, Severity.EMERGENCY, ...messages);
  }
  alert(module: string, ...messages: any[]) {
    this.sendToGraylog(module, Severity.ALERT, ...messages);
  }
  critical(module: string, ...messages: any[]) {
    this.sendToGraylog(module, Severity.CRITICAL, ...messages);
  }
  error(module: string, ...messages: any[]) {
    this.sendToGraylog(module, Severity.ERROR, ...messages);
  }
  warn(module: string, ...messages: any[]) {
    this.sendToGraylog(module, Severity.WARNING, ...messages);
  }
  notice(module: string, ...messages: any[]) {
    this.sendToGraylog(module, Severity.NOTICE, ...messages);
  }
  info(module: string, ...messages: any[]) {
    this.sendToGraylog(module, Severity.INFORMATION, ...messages);
  }
  debug(module: string, ...messages: any[]) {
    this.sendToGraylog(module, Severity.DEBUG, ...messages);
  }

  /**
   * !!! Will not send GELF! Only visible in application stdout!
   * @param module from where the message originated
   * @param messages
   */
  log(module: string, ...messages: any[]) {
    this.sendToGraylog(module, -1, ...messages);
  }

  private sendToGraylog(
    module: string,
    severity: Severity,
    messagePayload?: any
  );
  private sendToGraylog(
    module: string,
    severity: Severity,
    ...messages: any[]
  ) {
    if (severity > 0) {
      try {
        let shortMsg: string;
        let fullMsg: string;
        let stackTrace: string;
        let errorCode: number | string;
        let responseCode: number;
        if (typeof messages[0] === 'string') {
          [shortMsg, fullMsg, stackTrace, errorCode, responseCode] = messages;
        } else {
          const payload = messages[0];
          [shortMsg, fullMsg, stackTrace, errorCode, responseCode] = [
            `${payload.name}: ${payload.message}`,
            payload.message,
            payload.stack,
            payload.code,
            payload.errorCode,
          ];
        }
        const GELF = {
          version: '1.1',
          host: this.config.settings.host, // CMS_HOST
          short_message: shortMsg, // Error.message
          full_message: fullMsg,
          timestamp: +new Date() / 1000,
          level: severity, // syslog severity level https://en.wikipedia.org/wiki/Syslog#Severity_level
          _K8S_NAMESPACE: this.config.log.namespace, // environment setting
          _Severity: Severity[severity].toString(), // syslog severity level human readable
          _Stack: stackTrace || (fullMsg && fullMsg.replace(shortMsg, '')),
          _LoggerName: module,
          _errorCode: errorCode,
          _responseCode: responseCode,
        };
        switch (severity) {
          case Severity.EMERGENCY:
          case Severity.ALERT:
          case Severity.CRITICAL:
          case Severity.ERROR:
            console.error(GELF.short_message);
            break;
          case Severity.WARNING:
            console.warn(GELF.short_message);
            break;
          case Severity.INFORMATION:
            console.info(GELF.short_message);
            break;
          case Severity.DEBUG:
          case Severity.NOTICE:
          default:
            console.debug(GELF.short_message);
            break;
        }
        if (this.config.log.useGelf) {
          if (!this.config.log.useTcp) {
            this.sendUdp([Buffer.from(JSON.stringify(GELF))]);
          } else {
            this.sendTcp(Buffer.from(JSON.stringify(GELF) + '\n'));
          }
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      console.log(...messages); // !!! Will not send GELF!
    }
  }
}

// echo -n '{ "version": "1.1", "host": "example.org", "short_message": "A short message", "level": 5, "_some_info": "foo" }' | nc -w0 -u localhost 12201
