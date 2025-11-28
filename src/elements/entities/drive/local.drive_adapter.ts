import type { DriveAdapterConfig } from './drive_adapter';

import { NesoiFile } from '~/engine/data/file'
import { DriveAdapter } from './drive_adapter'
import fs from 'fs';
import path from 'path';

/**
 * @category Adapters
 * @subcategory Entity
 * */
export class LocalDriveAdapter extends DriveAdapter {
    
    constructor(
        public dirpath: string,
        config?: DriveAdapterConfig
    ) {
        super(config);
    }

    public public(remoteFile: NesoiFile) {
        return Promise.resolve(
            'file://' + path.join(process.cwd(), remoteFile.filepath)
        );
    }
    
    public read(remoteFile: NesoiFile) {
        return Promise.resolve(
            fs.readFileSync(remoteFile.filepath)
        );
    }
    
    public delete(remoteFile: NesoiFile) {
        return Promise.resolve(
            fs.rmSync(remoteFile.filepath)
        );
    }
    
    public move(remoteFile: NesoiFile, remotePath: string) {
        return Promise.resolve(
            fs.renameSync(remoteFile.filepath, remotePath)
        );
    }

    public async new(filename: string, data: string | NodeJS.ArrayBufferView, dirpath?: string) {
        dirpath = dirpath ? path.join(this.dirpath, dirpath) : this.dirpath;
        const remoteFilepath = path.join(dirpath, filename);
        fs.writeFileSync(remoteFilepath, data)
        return NesoiFile.local.from(remoteFilepath);
    }

    public async upload(localFile: NesoiFile, dirpath?: string, newFilename?: string) {
        dirpath = dirpath ? path.join(this.dirpath, dirpath) : this.dirpath;
        const remoteFilepath = path.join(dirpath, newFilename || localFile.filename);
        fs.copyFileSync(localFile.filepath, remoteFilepath);
        return NesoiFile.local.from(remoteFilepath, {
            originalFilename: localFile.originalFilename,
            extname: localFile.extname,
            mimetype: localFile.mimetype
        });
    }

    // public async sync(localFile: NesoiFile, remoteFile: NesoiFile) {
    //     if (fs.existsSync(remoteFile.filepath)) {
    //         if (localFile.hashAlgorithm === remoteFile.hashAlgorithm
    //             && localFile.hash === remoteFile.hash) {
    //             return remoteFile;
    //         }
    //         fs.rmSync(remoteFile.filepath);
    //     }
    //     return this.copy(localFile, path.dirname(remoteFile.filepath), remoteFile.newFilename!)
    // }
    
}