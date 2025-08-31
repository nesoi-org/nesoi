import ts from 'typescript';
import { MonolythBundler } from '../monolyth/monolyth.bundler';
import Console from '~/engine/util/console';
import { Log } from '~/engine/util/log';
import { ReplaceNesoiForBrowserStage } from './steps/8_replace_nesoi_for_browser_stage';

export class BrowserBundler extends MonolythBundler {
    
    public tsconfig: Record<string, string|number> = {
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
    }

    public async run() {
        await super.run();
        Console.header('Browser Bundler');

        Log.info('bundler', 'browser', `Importing the monolyth definition from ${this.appPath}`)

        await new ReplaceNesoiForBrowserStage(this).run();
    }
}