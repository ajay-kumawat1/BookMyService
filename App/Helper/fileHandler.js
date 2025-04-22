import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const uploaUsrImagedDir = path.join('public', 'uploads', 'User');
export const uploadBusinessOwnerLogoDir = path.join('public','uploads','Business','Owner');
export const uploadServiceImageDir = path.join('public','uploads','Service');

if (!fs.existsSync(uploaUsrImagedDir)) {
    fs.mkdirSync(uploaUsrImagedDir, { recursive: true });
}

if (!fs.existsSync(uploadBusinessOwnerLogoDir)) {
    fs.mkdirSync(uploadBusinessOwnerLogoDir, { recursive: true });
}

if (!fs.existsSync(uploadServiceImageDir)) {
    fs.mkdirSync(uploadServiceImageDir, { recursive: true });
}

const UserStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploaUsrImagedDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const BusinessStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploaUsrImagedDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const bookedServiceIdstorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploaUsrImagedDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

export const handleUserMultipartData = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1000000 * 5 },
})

export const handleBusinessOwnerMultipartData = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1000000 * 5 },
})

export const handleServiceMultipartData = multer({  
    storage: multer.memoryStorage(),
    limits: { fileSize: 1000000 * 5 },
})


