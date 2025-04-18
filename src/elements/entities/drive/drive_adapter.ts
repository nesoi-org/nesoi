import { NesoiFile } from '~/engine/data/file'

export type DriveAdapterConfig = {
    hashAlgorithm?: 'sha1' | 'md5' | 'sha256'
    maxsize?: number
}

export abstract class DriveAdapter {
    constructor(
        public dirpath: string,
        public config: DriveAdapterConfig = {}
    ) {}

    /**
     * Read one file from the Drive, given a NesoiFile specifier.
     * 
     * @returns The file contents as a Buffer
     */
    public abstract read(remoteFile: NesoiFile): Promise<Buffer>;

    /**
     * Create a new file on the Drive, from the contents.
     * 
     * @returns A new `NesoiFile` which refers to the Drive
     */
    public abstract new(filepath: string, data: string | NodeJS.ArrayBufferView): Promise<NesoiFile>;

    /**
     * Copy a local file to the Drive
     * - Fails if a file with the same name exists on the target dirpath of the Drive
     * 
     * @returns A new `NesoiFile` which refers to the Drive
     */
    public abstract copy(localFile: NesoiFile, dirpath: string, newFilename?: string): Promise<NesoiFile>;

    // /**
    //  * Copy a local file to the Drive if:
    //  * - it doesn't exist on the drive
    //  * - the hash on the drive is different than the local (overwrite)
    //  * 
    //  * @returns A `NesoiFile` which refers to the Drive
    //  */
    // public abstract sync(localFile: NesoiFile, remoteFile: NesoiFile): Promise<NesoiFile>;
}