Error.stackTraceLimit = Infinity;

import { Log } from 'nesoi/lib/engine/util/log';
import script from 'nesoi/lib/engine/cli/script';
import BigRockApp from 'apps/bigrock.app';

const args = script('cli', $ => $
    .d('Runs the CLI for some application')
    .arg('cmd', $ => $.value($ => $.zero_or_more))
    .arg('--env', '-e', $ => $.d('Specify a dotenv file to be used')
        .value('filename', $ => $.d('Name of the dotenv file to be used'))
    )
    .arg('--debug', '-d', $ => $.d('Enable debug logging'))
    .arg('--trace', '-t', $ => $.d('Enable trace logging'))
    .arg('--watch', '-w', $ => $.d('Enable hot reloading'))
    // .arg('--services', '-s', $ => $.d('Run the daemon with the specified services only')
    //     .value('names', $ => $.d('List of names of services').zero_or_more)
    // )
).init();

Log.level =
  args.debug ? 'debug'
      : args.trace ? 'trace'
          : 'info';

async function main() {

    const daemon = await BigRockApp.daemon({
        watch: args.watch,
        dotenv: args.env?.filename,
        // services: args.services?.names
    });

    await daemon.cli(args.cmd.length ? args.cmd.join(' ') : undefined);
  
    process.exit();
}

void main();
