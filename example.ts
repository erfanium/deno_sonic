import { Search } from "./mod.ts";

const search = new Search();

// search.client.debug = (...f) => console.debug(...f)

await search.client.connect({
  hostname: "127.0.0.1",
  port: 1491,
  password: "SecretPassword",
  mode: "search",
});

console.log("Connected");

search
  .query({
    collection: "messages",
    bucket: "default",
    terms: "Yesterday",
  })
  .then((r) => console.log(1, r));

search
  .query({
    collection: "messages",
    bucket: "default",
    terms: "کنسرت",
  })
  .then((r) => console.log(2, r));

search
  .query({
    collection: "messages",
    bucket: "default",
    terms: "YesterdaY ",
  })
  .then((r) => console.log(3, r));
