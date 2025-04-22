import fs from 'fs'
import path from 'path'
import { Hash } from '../util/hash';
import { Mime } from '../util/mime';

// Based on [formidable](https://github.com/node-formidable/formidable)

export class NesoiFile {
    
    public __nesoi_file = true;
    
    // The path this file is being written to. You can modify this in the `'fileBegin'` event in
    // case you are unhappy with the way formidable generates a temporary path for your files.
    public filepath: string

    // The current filename
    public filename: string

    // The file extension name, without '.', for example: 'svg', 'png'
    public extname: string

    // The mime type of this file, according to the uploading client.
    public mimetype: string | null

    // The size of the uploaded file in bytes.
    // If the file is still being uploaded (see `'fileBegin'` event),
    // this property says how many bytes of the file have been written to disk yet.
    public size: number

    // The name this file had according to the uploading client.
    public originalFilename: string | null

    // The name to assign to this object when copying/syncing it
    public newFilename: string

    // A Date object (or `null`) containing the time this file was last written to.
    // Mostly here for compatibility with the [W3C File API Draft](http://dev.w3.org/2006/webapi/FileAPI/).
    public mtime: Date | null

    public hashAlgorithm: false | 'sha1' | 'md5' | 'sha256' = false

    // Only available after `.hash` is called
    private _hash: string | object | null = null

    constructor(
        filepath: string,
        extra?: {
            originalFilename?: string | null
            newFilename?: string | null
        }
    ) {
        this.filepath = filepath;
        this.filename = path.basename(filepath);
        
        const mime = Mime.ofFilepath(filepath);
        this.extname = extra?.originalFilename
            ? path.extname(extra.originalFilename).slice(1)
            : mime.extname;
        this.mimetype = mime.mimetype;

        const stat = fs.statSync(filepath)
        this.size = stat.size

        this.originalFilename = extra?.originalFilename || null;
        this.newFilename = extra?.newFilename || this.filename;
        this.mtime = stat.mtime;
    }

    public async hash(hashAlgorithm: 'sha1' | 'md5' | 'sha256') {
        if (!this._hash) {
            this.hashAlgorithm = hashAlgorithm;
            this._hash = Hash.file(this.filepath, this.hashAlgorithm).then(hash => {
                this._hash = hash;
            });
        }
        return {
            algorithm: hashAlgorithm,
            hash: this._hash
        }
    }

    public delete() {
        if (fs.existsSync(this.filepath)) fs.rmSync(this.filepath);
    }

    public move(to: string) {
        if (fs.existsSync(this.filepath)) fs.renameSync(this.filepath, to);
        this.filepath = to;
    }
}