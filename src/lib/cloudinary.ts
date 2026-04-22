import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

let isConfigured = false;

function ensureCloudinaryConfig() {
  if (isConfigured) return;

  if (!process.env.CLOUDINARY_URL) {
    throw new Error("CLOUDINARY_URL is missing");
  }

  cloudinary.config({
    secure: true,
  });

  isConfigured = true;
}

export async function optimizeToWebp(
  inputBuffer: Buffer,
  options?: {
    maxWidth?: number;
    quality?: number;
  }
): Promise<Buffer> {
  const maxWidth = options?.maxWidth ?? 1920;
  const quality = options?.quality ?? 82;

  return sharp(inputBuffer)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

export async function uploadImageBufferToCloudinary(
  buffer: Buffer,
  options?: {
    folder?: string;
    publicId?: string;
  }
): Promise<{ publicId: string; secureUrl: string }> {
  ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder ?? "vehicles",
        public_id: options?.publicId,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          publicId: result.public_id,
          secureUrl: result.secure_url,
        });
      }
    );

    stream.end(buffer);
  });
}

export function buildOptimizedImageUrl(publicId: string): string {
  ensureCloudinaryConfig();

  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: "auto",
    quality: "auto",
    crop: "limit",
    width: 1600,
  });
}
