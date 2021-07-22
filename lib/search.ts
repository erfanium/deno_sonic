import { SonicClient } from "./client.ts";
import { format, quoted } from "./fmt.ts";
import { limitString } from "./utils.ts";

export interface QueryParams {
  collection: string;
  bucket: string;
  terms: string;
  limit?: number;
  offset?: number;
  lang?: string;
}

export interface SuggestParams {
  collection: string;
  bucket: string;
  word: string;
  limit?: number;
}

export class Search {
  client = new SonicClient("search");

  async query(params: QueryParams): Promise<string[]> {
    const command = format(
      "QUERY",
      [
        params.collection,
        params.bucket,
        limitString(quoted(params.terms), this.client.cmdMaxBytes),
      ],
      {
        limit: params.limit?.toString(),
        offset: params.offset?.toString(),
        lang: params.lang,
      },
    );

    await this.client.write(command);
    const pendingMessage = await this.client.once("PENDING");
    const queryId = pendingMessage.slice(8);

    const result = await this.client.once("EVENT QUERY " + queryId);
    return result.split(" ").slice(3);
  }

  async suggest(params: SuggestParams): Promise<string[]> {
    if (params.word.indexOf(" ") !== -1) {
      throw new Error("Word should not contain spaces");
    }

    const command = format(
      "SUGGEST",
      [
        params.collection,
        params.bucket,
        limitString(quoted(params.word), this.client.cmdMaxBytes),
      ],
      {
        limit: params.limit?.toString(),
      },
    );

    await this.client.write(command);
    const pendingMessage = await this.client.once("PENDING");
    const queryId = pendingMessage.slice(8);

    const result = await this.client.once("EVENT SUGGEST " + queryId);
    return result.split(" ").slice(3);
  }
}
