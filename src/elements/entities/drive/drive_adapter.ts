import { NesoiFile } from '~/engine/data/file'

export type DriveAdapterConfig = {
    hashAlgorithm?: 'sha1' | 'md5' | 'sha256'
    maxsize?: number
}

export abstract class DriveAdapter {
    constructor(
        public config: DriveAdapterConfig = {}
    ) {}

    /**
     * Return a public reference to the file as a string, which
     *  can be used outside the application to reach it.
     * 
     * @param filename An optional filename to use on Content-Disposition header
     * @returns A list of `string` which publicly refers to the files
     */
    public abstract public(remoteFile: NesoiFile, filename?: string): Promise<string>;

    /**
     * Read one file from the Drive, given a NesoiFile specifier.
     * 
     * @returns The file contents as a Buffer
     */
    public abstract read(remoteFile: NesoiFile): Promise<Buffer>;

    /**
     * Delete one file from the Drive, given a NesoiFile specifier.
     */
    public abstract delete(remoteFile: NesoiFile): Promise<void>;

    /**
     * Move a file within the Drive
     */
    public abstract move(remoteFile: NesoiFile, newRemotePath: string): Promise<void>;

    /**
     * Create a new file on the Drive, from the contents.
     * 
     * @returns A new `NesoiFile` referencing a file on the Drive
     */
    public abstract new(filename: string, data: string | NodeJS.ArrayBufferView, dirpath?: string): Promise<NesoiFile>;

    /**
     * Copy a local file to the Drive
     * - Should fail if a file with the same name exists on the target dirpath of the Drive
     * - Should preserve originalFilename, extname and mimetype
     * 
     * @returns A new `NesoiFile` referencing a file on the Drive
     */
    public abstract upload(localFile: NesoiFile, dirpath?: string, newFilename?: string): Promise<NesoiFile>;

    // /**
    //  * Copy a local file to the Drive if:
    //  * - it doesn't exist on the drive
    //  * - the hash on the drive is different than the local (overwrite)
    //  * 
    //  * @returns A `NesoiFile` referencing a file on the Drive
    //  */
    // public abstract sync(localFile: NesoiFile, remoteFile: NesoiFile): Promise<NesoiFile>;
}