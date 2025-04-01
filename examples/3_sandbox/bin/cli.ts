import 'nesoi/tools/dotenv';
import { Log } from 'nesoi/lib/engine/util/log';
import BigRock from '../apps/bigrock.app';

Log.level = 'info';

async function main() {
    const app = await BigRock.daemon();
    await app.cli();
}

main();