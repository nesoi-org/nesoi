import { NesoiFile } from '~/engine/data/file'
import { DriveAdapter } from './drive_adapter'
import fs from 'fs';
import path from 'path';

export class LocalDriveAdapter extends DriveAdapter {
    
    public public(remoteFiles: NesoiFile[]) {
        return Promise.resolve(remoteFiles.map(file => 
            path.join(process.cwd(), file.filepath)
        ));
    }
    
    public read(remoteFile: NesoiFile) {
        return Promise.resolve(
            fs.readFileSync(remoteFile.filepath)
        );
    }

    public async new(filepath: string, data: string | NodeJS.ArrayBufferView) {
        fs.writeFileSync(filepath, data)
        return new NesoiFile(filepath);
    }

    public async copy(localFile: NesoiFile, dirpath: string) {
        const remoteFilepath = path.join(dirpath, localFile.newFilename)
        fs.copyFileSync(localFile.filepath, remoteFilepath);
        return new NesoiFile(remoteFilepath, { originalFilename: localFile.originalFilename });
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