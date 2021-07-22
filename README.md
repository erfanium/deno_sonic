# deno_sonic

Sonic search engine driver for Deno. With async support.

## Status

### Implemented parts

- **search mode** (query, suggest)
- **ingest mode** (push, pop, count, flush)

### Not implemented parts

Check `bug` issues.

## Example

```ts
import { Search } from "../mod.ts";

const search = new Search();

// search.client.debug = (...f) => console.debug(...f);

await search.connect({
  hostname: "127.0.0.1",
  port: 1491,
  password: "SecretPassword",
});

console.log("Connected");

const result = await search.query({
  collection: "messages",
  bucket: "default",
  terms: "Dragon",
});

console.log(result);

search.close();
```
