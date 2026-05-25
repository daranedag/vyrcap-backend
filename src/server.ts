import app from "./app.js";
import { env } from "./config/env.js";

if (env.NODE_ENV !== "test") {
  app.listen(env.PORT, () => {
    console.log(`vyrcap-backend listening on port ${env.PORT}`);
  });
}
