import { createServer } from "node:http";

const port = process.env.PORT || 3000;

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ status: "ok", url: req.url }));
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
