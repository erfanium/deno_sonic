import { Deferred, deferred, readLines } from "../deps.ts";

export type ChannelMode = "search" | "ingest" | "control";

export interface ConnectOptions {
  port: number;
  hostname: string;
  password: string;
  mode: ChannelMode;
}

interface Event {
  startWith: string;
  p: Deferred<string>;
}

const encoder = new TextEncoder();
const resultItemPattern = /^([a-z_]+)\(([^\)\()]*)\)$/;

function parseStartMessage(result: string) {
  const resultItems = (result || "").split(" ").slice(1);
  const resultParsed: Record<string, string | number> = {};

  for (let i = 0; i < resultItems.length; i++) {
    const match = resultItems[i].match(resultItemPattern);

    if (match && match[1] && match[2]) {
      if (!isNaN(Number(match[2]))) {
        resultParsed[match[1]] = parseInt(match[2], 10);
      } else {
        resultParsed[match[1]] = match[2];
      }
    }
  }

  return resultParsed as { buffer: number };
}

export function isChannelValid(ch: string): boolean {
  return ch === "search" || ch == "ingest" || ch == "control";
}

export class SonicClient {
  conn?: Deno.Conn;
  cmdMaxBytes = 20000;
  debug: (...params: unknown[]) => unknown = () => undefined;
  #eventQueue: Set<Event> = new Set();

  protected resolveEvent(event: Event, value: string) {
    this.#eventQueue.delete(event);
    event.p.resolve(value);
  }

  protected rejectEvent(event: Event, value: Error) {
    this.#eventQueue.delete(event);
    event.p.reject(value);
  }

  protected addEvent(event: Event) {
    this.#eventQueue.add(event);
  }

  protected getLastEvent(): Event | null {
    let event: Event | null = null;
    this.#eventQueue.forEach((v) => {
      event = v;
    });
    return event;
  }

  async startLoop() {
    if (!this.conn) {
      throw new Error("Client is closed");
    }

    for await (const line of readLines(this.conn)) {
      this.debug("RECEIVED", line);

      if (line.startsWith("ERR ")) {
        const lastEvent = this.getLastEvent();
        if (!lastEvent) continue;
        const error = new Error(line.slice(4));
        this.rejectEvent(lastEvent, error);
        continue;
      }

      for (const event of this.#eventQueue) {
        if (line.startsWith(event.startWith)) {
          this.resolveEvent(event, line);
          break;
        }
      }
    }
  }

  once(startWith: string): Promise<string> {
    const p = deferred<string>();
    this.addEvent({ startWith, p });
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
    const startMess = await this.once("STARTED");
    const serverConfigs = parseStartMessage(startMess);

    this.cmdMaxBytes = serverConfigs.buffer;
  }

  eventQueueSize() {
    return this.#eventQueue.size;
  }
}
