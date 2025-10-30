import { web } from "./application/web.js";
import { logger } from "./application/logging.js";

const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || "development";

web.listen(PORT, () => {
    logger.info(`🚀 App running in ${ENV} mode on port ${PORT}`);
});