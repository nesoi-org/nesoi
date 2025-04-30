import fs from 'fs'
import path from 'path'
import { Hash } from '../util/hash';
import { Mime } from '../util/mime';
import { TrxNode } from '../transaction/trx_node';
import { $Module } from '~/elements';

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
        filename: string,
        extname: string,
        mimetype: string | null,
        size: number,
        originalFilename: string | null,
        newFilename: string,
        mtime: Date | null
    ) {
        this.filepath = filepath;
        this.filename = filename;
        this.extname = extname;
        this.mimetype = mimetype;
        this.size = size;
        this.originalFilename = originalFilename;
        this.newFilename = newFilename;
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
            overrides.newFilename || file.newFilename,
            overrides.mtime || file.mtime,
        )
    }

    public static fromLocalFile(
        filepath: string,
        extra?: {
            originalFilename?: string | null
            newFilename?: string | null
        }
    ) {
        const filename = path.basename(filepath);
        
        const mime = Mime.ofFilepath(filepath);
        const extname = extra?.originalFilename
            ? path.extname(extra.originalFilename).slice(1)
            : mime.extname;
        const mimetype = mime.mimetype;

        const stat = fs.statSync(filepath)
        const size = stat.size

        const originalFilename = extra?.originalFilename || null;
        const newFilename = extra?.newFilename || filename;
        const mtime = stat.mtime;

        return new NesoiFile(
            filepath,
            filename,
            extname,
            mimetype,
            size,
            originalFilename,
            newFilename,
            mtime
        )
    }

    public static async hash(file: NesoiFile, hashAlgorithm: 'sha1' | 'md5' | 'sha256') {
        if (!file._hash) {
            file.hashAlgorithm = hashAlgorithm;
            file._hash = Hash.file(file.filepath, file.hashAlgorithm).then(hash => {
                file._hash = hash;
            });
        }
        return {
            algorithm: hashAlgorithm,
            hash: file._hash
        }
    }

    public static delete<M extends $Module>($: { trx: TrxNode<any, M, any> }, bucket: keyof M['buckets'], file: NesoiFile, options?: { silent?: boolean }) {
        return $.trx.bucket(bucket).drive.delete(file, options);
    }

    public static async move<M extends $Module>($: { trx: TrxNode<any, M, any> }, bucket: keyof M['buckets'], file: NesoiFile, to: string, options?: { silent?: boolean }) {
        await $.trx.bucket(bucket).drive.move(file, to, options);
        file.filepath = to;
    }

    public static async read<M extends $Module>($: { trx: TrxNode<any, M, any> }, bucket: keyof M['buckets'], file: NesoiFile, options?: { silent?: boolean }) {
        await $.trx.bucket(bucket).drive.read(file, options);
    }
}