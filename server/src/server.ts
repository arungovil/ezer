import "dotenv/config";
import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";

const { port } = getEnv();
const app = createApp();

app.listen(port);
