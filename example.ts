import { Search } from "./mod.ts";

const search = new Search();

// search.client.debug = (...f) => console.debug(...f);

await search.client.connect({
  hostname: "127.0.0.1",
  port: 1491,
  password: "SecretPassword",
  mode: "search",
});

console.log("Connected");

const result = await search.query({
  collection: "messages",
  bucket: "default",
  terms: "Hey",
});

console.log(result);
