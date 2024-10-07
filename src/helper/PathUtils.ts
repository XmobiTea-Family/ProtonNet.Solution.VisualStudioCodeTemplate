import * as fs from 'fs';
import * as path from 'path';

export class PathUtils {
    public static getAllFiles(dirPath: string): string[] {
        let answer: string[] = [];

        const files = fs.readdirSync(dirPath);

        files.forEach((file) => {
            const fullPath = path.join(dirPath, file);

            if (fs.statSync(fullPath).isDirectory()) {
                // Nếu là thư mục, tiếp tục duyệt đệ quy
                answer.push(...PathUtils.getAllFiles(fullPath));
            } else {
                // Nếu là file, thêm vào mảng arrayOfFiles
                answer.push(fullPath);
            }
        });

        return answer;
    }

    public static toNamespace(path: string): string {
        // Thay thế tất cả các dấu phân cách thư mục (cả '/' và '\') thành '.'
        let namespace = path.replace(/[\\/]/g, '.');

        // Loại bỏ các ký tự không hợp lệ trong C# namespace (giữ lại a-z, A-Z, 0-9, và '_')
        namespace = namespace.replace(/[^a-zA-Z0-9_.]/g, '');

        // Chuyển mỗi phần của namespace thành PascalCase, nhưng không thay đổi độ lớn của chữ
        namespace = namespace.split('.').map(part => {
            // Chỉ chuyển chữ cái đầu tiên thành hoa, phần còn lại giữ nguyên
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join('.');

        if (namespace.startsWith(".")) namespace = namespace.slice(1);

        return namespace;
    }
}
