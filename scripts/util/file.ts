import * as fs from 'fs';

export default class File {

    static replaceInContent(filepath: string, searchValue: RegExp, replaceValue: string) {
        let content = fs.readFileSync(filepath).toString();
        content = content.replace(searchValue, replaceValue);
        fs.writeFileSync(filepath, content);
    }

}


