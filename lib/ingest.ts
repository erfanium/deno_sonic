import { SonicClient } from "./client.ts";
import { format, quoted } from "./fmt.ts";
import { chunkString } from "./utils.ts";

export interface PushParams {
  collection: string;
  bucket: string;
  object: string;
  text: string;
  lang?: string;
}

export interface PopParams {
  collection: string;
  bucket: string;
  object: string;
  text: string;
}

export interface CountParams {
  collection: string;
  bucket?: string;
  object?: string;
}

export interface FlushParams {
  collection: string;
  bucket?: string;
  object?: string;
}

export class Ingest {
  client = new SonicClient("ingest");

  async push(params: PushParams) {
    const chunks = chunkString(params.text, this.client.cmdMaxBytes);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const command = format(
        "PUSH",
        [params.collection, params.bucket, params.object, quoted(chunk)],
        {
          lang: params.lang,
        },
      );

      await this.client.write(command);
      await this.client.once("OK");
    }
  }

  async pop(params: PopParams): Promise<number> {
    const chunks = chunkString(params.text, this.client.cmdMaxBytes);
    let deleted = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const command = format(
        "POP",
        [params.collection, params.bucket, params.object, quoted(chunk)],
      );

      await this.client.write(command);
      const message = await this.client.once("RESULT ");
      deleted += parseInt(message.slice(7));
    }

    return deleted;
  }

  async count(params: CountParams) {
    const command = format(
      "COUNT",
      [params.collection, params.bucket, params.object],
    );

    await this.client.write(command);
    const message = await this.client.once("RESULT ");
    return parseInt(message.slice(7));
  }

  async flush(params: FlushParams) {
    let command: string;
    if (params.object) {
      command = format("FLUSHO", [
        params.collection,
        params.bucket,
        params.object,
      ]);
    } else if (params.bucket) {
      command = format("FLUSHB", [params.collection, params.bucket]);
    } else {
      command = format("FLUSHC", [params.collection]);
    }

    await this.client.write(command);
    const message = await this.client.once("RESULT ");
    return parseInt(message.slice(7));
  }
}
