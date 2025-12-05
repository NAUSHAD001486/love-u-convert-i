"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUPPORTED_FORMATS = void 0;
exports.isValidFormat = isValidFormat;
exports.getFileExtension = getFileExtension;
exports.SUPPORTED_FORMATS = {
    IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
    DOCUMENT: ['pdf', 'doc', 'docx', 'txt'],
    ARCHIVE: ['zip', 'rar', '7z'],
};
function isValidFormat(format, category) {
    const formats = exports.SUPPORTED_FORMATS[category];
    return formats.includes(format.toLowerCase());
}
function getFileExtension(filename) {
    return filename.split('.').pop()?.toLowerCase() || '';
}
//# sourceMappingURL=formats.js.map