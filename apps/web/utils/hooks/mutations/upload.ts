import { SignResponse } from "server/routers/upload";
import { z } from "zod";
import { cloudName } from "shared/media/format";

const uploadResponseSchema = z.object({
  secure_url: z.string(),
  version: z.number(),
  resource_type: z.enum(["raw", "image", "video"]),
  bytes: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
});

type UploadResponse = z.infer<typeof uploadResponseSchema>;

export type UploadOptions = {
  file: string | Blob;
  resource_type?: "image" | "raw" | "auto";
} & SignResponse;

async function uploadAsset(options: UploadOptions): Promise<UploadResponse> {
  const type = options.resource_type ?? "image";
  const body = new FormData();

  body.append("file", options.file);
  body.append("signature", options.signature);
  body.append("api_key", options.api_key);
  body.append("timestamp", options.timestamp.toString());

  if (options.transformation != null) {
    body.append("transformation", options.transformation);
  }
  if (options.public_id != null) {
    body.append("public_id", options.public_id);
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`,
    {
      method: "POST",
      body: body,
    },
  );

  if (!res.ok) throw new Error(await res.json());
  return uploadResponseSchema.parse(await res.json());
}

export async function upload(
  sign: SignResponse | (() => SignResponse | Promise<SignResponse>),
  file: string | Blob,
  options?: Partial<UploadOptions>,
) {
  const signed = typeof sign === "function" ? await sign() : sign;

  return uploadAsset({
    file: file,
    ...signed,
    ...options,
  });
}
