import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  buildOptimizedImageUrl,
  optimizeToWebp,
  uploadImageBufferToCloudinary,
} from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
const ALLOWED_UPLOAD_FOLDERS = new Set(["vehicles", "brands", "dealerships", "site"]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const folder = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Fichier image manquant" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image" },
        { status: 400 }
      );
    }

    const maxSizeInBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return NextResponse.json(
        { error: "Image trop volumineuse (max 10MB)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const sourceBuffer = Buffer.from(arrayBuffer);
    const webpBuffer = await optimizeToWebp(sourceBuffer);

    const requestedFolder = typeof folder === "string" ? folder.trim() : "";
    const safeFolder = ALLOWED_UPLOAD_FOLDERS.has(requestedFolder) ? requestedFolder : "vehicles";

    const uploadResult = await uploadImageBufferToCloudinary(webpBuffer, {
      folder: safeFolder,
    });

    const optimizedUrl = buildOptimizedImageUrl(uploadResult.publicId);

    return NextResponse.json({
      publicId: uploadResult.publicId,
      url: optimizedUrl,
      secureUrl: uploadResult.secureUrl,
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload de l'image" },
      { status: 500 }
    );
  }
}
