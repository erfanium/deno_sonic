import { SonicClient } from "./client.ts";
import { format, quoted } from "./fmt.ts";

export interface QueryParams {
  collection: string;
  bucket: string;
  terms: string;
  limit?: number;
  offset?: number;
  locale?: string;
}

export class Search {
  client = new SonicClient();

  async query(params: QueryParams): Promise<string[]> {
    const command = format(
      "QUERY",
      [params.collection, params.bucket, quoted(params.terms)],
      {
        limit: params.limit?.toString(),
        offset: params.offset?.toString(),
        locale: params.locale,
      },
    );

    await this.client.write(command);
    const pendingMessage = await this.client.once("PENDING");
    const queryId = pendingMessage.slice(8);

    const result = await this.client.once("EVENT QUERY " + queryId);
    return result.split(" ").slice(3);
  }
}
