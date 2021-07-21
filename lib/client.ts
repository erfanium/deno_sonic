import { Deferred, deferred, readLines } from "../deps.ts";

export type ChannelMode = "search" | "ingest" | "control";

export interface ConnectOptions {
  port: number;
  hostname: string;
  password: string;
  mode: ChannelMode;
}

export enum ClientStatus {
  Disconnect,
  Connect,
}

const encoder = new TextEncoder();

export function isChannelValid(ch: string): boolean {
  return ch === "search" || ch == "ingest" || ch == "control";
}

export class SonicClient {
  conn?: Deno.Conn;
  cmdMaxBytes?: number;
  listeners: Set<{ prefix: string; p: Deferred<string> }> = new Set();
  debug: (...params: unknown[]) => unknown = () => undefined;

  async startLoop() {
    if (!this.conn) {
      throw new Error("Client is closed");
    }

    for await (const line of readLines(this.conn)) {
      this.debug("RECEIVED", line);

      if (line.startsWith("ERR ")) {
        throw new Error(line.slice(4));
      }

      for (const event of this.listeners) {
        if (line.startsWith(event.prefix)) {
          this.listeners.delete(event);
          event.p.resolve(line);
          break;
        }
      }
    }
  }

  once(prefix: string): Promise<string> {
    const p = deferred<string>();
    this.listeners.add({ prefix, p });
    return p;
  }

  write(data: string) {
    if (!this.conn) {
      throw new Error("Client is closed");
    }
    this.debug("WRITE", data);
    return this.conn.write(encoder.encode(data + "\n"));
  }

  async connect(opts: ConnectOptions) {
    this.conn = await Deno.connect(opts);
    this.startLoop();
    await this.once("CONNECTED");
    await this.write(`START ${opts.mode} ${opts.password}`);
    await this.once("STARTED");
  }
}
