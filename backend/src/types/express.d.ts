import { File } from "multer";

declare global {
  namespace Express {
    interface Request {
      file?: File;
      files?: {
        [fieldname: string]: File[];
      };
    }
  }
}

export {};
