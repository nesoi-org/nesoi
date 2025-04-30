import { NesoiFile } from '~/engine/data/file'
import { DriveAdapter, DriveAdapterConfig } from './drive_adapter'
import fs from 'fs';
import path from 'path';

export class LocalDriveAdapter extends DriveAdapter {
    
    constructor(
        public dirpath: string,
        config?: DriveAdapterConfig
    ) {
        super(config);
    }

    public public(remoteFiles: NesoiFile[]) {
        return Promise.resolve(remoteFiles.map(file => 
            'file://' + path.join(process.cwd(), file.filepath)
        ));
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
        return NesoiFile.fromLocalFile(remoteFilepath);
    }

    public async upload(localFile: NesoiFile, dirpath?: string, newFilename?: string) {
        dirpath = dirpath ? path.join(this.dirpath, dirpath) : this.dirpath;
        const remoteFilepath = path.join(dirpath, newFilename || localFile.newFilename);
        fs.copyFileSync(localFile.filepath, remoteFilepath);
        return NesoiFile.fromLocalFile(remoteFilepath, { originalFilename: localFile.originalFilename });
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