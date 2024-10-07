import * as fs from 'fs';
import * as path from 'path';

export class CustomWebView {
    private mainHtml: string;

    constructor(mediaPath: string) {
        this.mainHtml = fs.readFileSync(path.join(mediaPath, "main.html")).toString();
    }

    public getHtmlContent(bodyHtml: string) {
        return this.mainHtml.replace("@renderBody();", bodyHtml);
    }
}
