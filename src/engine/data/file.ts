import fs from 'fs'
import path from 'path'
import { Hash } from '../util/hash';
import { Mime } from '../util/mime';

/**
 * @category Engine
 * @subcategory Data
 */
export class LocalNesoiFile {
    
    /**
     * - If not overriden, `extname` is derived from `filepath` 
     *   - If `overrides.originalFilename` is passed, `extname` is derived from it (this allows saving the file without extension, but keeping the information on NesoiFile).
     * - If not overriden, `mimetype` is derived from the resolved `extname`
     */
    public static from(
        filepath: string,
        overrides?: Partial<NesoiFile>
    ) {
        const filename = overrides?.filename || path.basename(filepath);
        
        let extname;
        if (overrides?.extname) {
            extname = overrides.extname;
        }
        else {
            if (overrides?.originalFilename) {
                extname = path.extname(overrides?.originalFilename).slice(1);
            }
            else {
                extname = path.extname(filepath).slice(1);
            }
        }

        const mimetype = overrides?.mimetype || Mime.ofExtname(extname);

        const stat = fs.statSync(filepath)
        const mtime = stat.mtime
        const size = stat.size

        const originalFilename = overrides?.originalFilename || null;

        return new NesoiFile(
            filepath,
            filename,
            extname,
            mimetype,
            size,
            originalFilename,
            mtime
        )
    }

    public static delete(file: NesoiFile) {
        fs.rmSync(file.filepath);
    }

    public static move(file: NesoiFile, to: string) {
        fs.renameSync(file.filepath, to);
        file.filepath = to;
        file.filename = path.basename(to);
    }

    public static read(file: NesoiFile) {
        return fs.readFileSync(file.filepath).toString()
    }

    public static new(
        filepath: string,
        content: string,
        overrides?: Partial<NesoiFile>
    ) {
        fs.writeFileSync(filepath, content);
        return this.from(filepath, overrides);
    }
}

/**
 * @category Engine
 * @subcategory Data
 */
export class NesoiFile {
    
    public __nesoi_file = true;
    
    // The full path to the file on the drive where it belongs
    public filepath: string

    // The filename extracted from the filepath
    public filename: string

    // The file extension name, without '.', for example: 'svg', 'png'
    public extname: string

    // The mime type of this file, calculated from the extension
    public mimetype: string | null

    // The size of the uploaded file in bytes.
    public size: number

    // The name this file had according to the uploading client.
    public originalFilename: string | null

    // A Date object (or `null`) containing the time this file was last written to.
    // Mostly here for compatibility with the [W3C File API Draft](http://dev.w3.org/2006/webapi/FileAPI/).
    public mtime: Date | null

    // Algorithm used to generate the hash
    public hashAlgorithm: false | 'sha1' | 'md5' | 'sha256' = false

    // Only available after `.hash` is called
    private hash: string | object | null = null

    constructor(
        filepath: string,
        filename: string,
        extname: string,
        mimetype: string | null,
        size: number,
        originalFilename: string | null,
        mtime: Date | null
    ) {
        this.filepath = filepath;
        this.filename = filename;
        this.extname = extname;
        this.mimetype = mimetype;
        this.size = size;
        this.originalFilename = originalFilename;
        this.mtime = mtime;
    }

    public static from(file: NesoiFile, overrides: Partial<NesoiFile>) {
        return new NesoiFile(
            overrides.filepath || file.filepath,
            overrides.filename || file.filename,
            overrides.extname || file.extname,
            overrides.mimetype || file.mimetype,
            overrides.size || file.size,
            overrides.originalFilename || file.originalFilename,
            overrides.mtime || file.mtime,
        )
    }

    public static async hash(file: NesoiFile, hashAlgorithm: 'sha1' | 'md5' | 'sha256') {
        if (!file.hash) {
            file.hashAlgorithm = hashAlgorithm;
            file.hash = Hash.file(file.filepath, file.hashAlgorithm).then(hash => {
                file.hash = hash;
            });
        }
        return {
            algorithm: hashAlgorithm,
            hash: file.hash
        }
    }

    public static local = LocalNesoiFile

}
