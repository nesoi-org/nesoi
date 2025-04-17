import { NesoiFile } from '~/engine/data/file'
import { DriverAdapter } from './drive_adapter'
import fs from 'fs';
import { randomUUID } from 'crypto';
import path from 'path';
import { Mime } from '~/engine/util/mime';
import { Hash } from '~/engine/util/hash';

export class LocalDriverAdapter extends DriverAdapter {
    
    public read(file: NesoiFile) {
        return Promise.resolve(
            fs.readFileSync(file.filepath)
        );
    }

    public async new(filepath: string, data: string | NodeJS.ArrayBufferView, newFilename?: string) {
        fs.writeFileSync(filepath, data)
        newFilename = this.makeFilename(newFilename);
        return this.make(filepath, newFilename);
    }

    public async copy(localFile: NesoiFile, dirpath: string, newFilename?: string) {
        newFilename = this.makeFilename(newFilename);
        const remoteFilepath = path.join(dirpath, newFilename)

        fs.copyFileSync(localFile.filepath, remoteFilepath);

        return this.make(remoteFilepath, newFilename);        
    }

    public async sync(localFile: NesoiFile, remoteFile: NesoiFile) {
        if (fs.existsSync(remoteFile.filepath)) {
            if (localFile.hashAlgorithm === remoteFile.hashAlgorithm
                && localFile.hash === remoteFile.hash) {
                return remoteFile;
            }
            fs.rmSync(remoteFile.filepath);
        }
        return this.copy(localFile, path.dirname(remoteFile.filepath), remoteFile.newFilename!)
    }
    
    private makeFilename(newFilename?: string) {
        return newFilename || randomUUID();
    }

    private async make(filepath: string, newFilename: string) {
        const stats = fs.statSync(filepath);
        const originalFilename = path.basename(filepath);
        const mimetype = Mime.ofFilepath(filepath);
        const hashAlgorithm = 'sha256';
        const hash = await Hash.file(filepath, hashAlgorithm);

        return new NesoiFile(
            stats.size,
            filepath,
            originalFilename,
            newFilename,
            mimetype,
            stats.mtime,
            hashAlgorithm,
            hash
        )
    }

}