export class StringUtils {
    public static toSafeNamespace(input: string): string {
        // Bước 1: Loại bỏ ký tự không hợp lệ
        let cleanedInput = input.replace(/[^a-zA-Z0-9._]/g, '');

        // Bước 2: Đảm bảo không bắt đầu bằng số hoặc dấu chấm
        cleanedInput = cleanedInput.replace(/^[0-9.]+/, '');

        // Bước 3: Không thay đổi chữ hoa và chữ thường của từng phần
        // Không cần phải thay đổi case, chỉ cần giữ nguyên các phần đã tách
        cleanedInput = cleanedInput.split('.').map(part => part).join('.');

        // Bước 4: Trả về chuỗi đã được chuẩn hóa thành namespace hợp lệ
        return cleanedInput;
    }

    public static toSafeClassname(input: string): string {
        // Bước 1: Xóa các ký tự không hợp lệ (giữ lại a-z, A-Z, 0-9, _)
        let cleanedInput = input.replace(/[^a-zA-Z0-9_]/g, '');

        // Bước 2: Đảm bảo không bắt đầu bằng số (nếu có thì thêm tiền tố)
        if (/^[0-9]/.test(cleanedInput)) {
            cleanedInput = '_' + cleanedInput;
        }

        // Bước 4: Trả về tên class hợp lệ
        return cleanedInput;
    }

    public static generateRandomId(): string {
        // Tạo ra 32 ký tự ngẫu nhiên dạng hexadecimal
        const hexDigits = "0123456789ABCDEF";
        let id = "";

        // Tạo chuỗi 32 ký tự ngẫu nhiên
        for (let i = 0; i < 32; i++) {
            id += hexDigits[Math.floor(Math.random() * 16)];
        }

        // Chèn dấu gạch nối vào đúng vị trí
        return `${id.substring(0, 8)}-${id.substring(8, 12)}-${id.substring(12, 16)}-${id.substring(16, 20)}-${id.substring(20)}`;
    }
}
