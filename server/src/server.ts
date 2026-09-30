import "dotenv/config";
import { createApp } from "./app.ts";
import { getEnv } from "./config/env.ts";

const { port } = getEnv();
const app = createApp();

app.listen(port);
