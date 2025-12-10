import api from "@/lib/api";
import type { ServiceResult, User } from "@/types";

export type UploadableImage = {
  uri: string;
  name?: string;
  type?: string;
};

async function imageToFormDataPart(
  image: UploadableImage,
  fallbackName: string,
) {
  const response = await fetch(image.uri);
  const buffer = await response.arrayBuffer();

  const type =
    image.type ?? response.headers.get("Content-Type") ?? "image/jpeg";
  const name = image.name ?? fallbackName;

  return {
    blob: new Blob([buffer], { type }),
    name,
  };
}

export async function searchUsers(
  query: string,
): Promise<ServiceResult<User[]>> {
  try {
    const res = await api.get(
      `/users/search?query=${encodeURIComponent(query)}`,
    );
    return { success: true, data: res.data.data as User[] };
  } catch (error) {
    return { success: false, error };
  }
}

export async function updateProfile(
  userId: string,
  payload: { name?: string; avatar?: UploadableImage },
): Promise<ServiceResult<any>> {
  try {
    const form = new FormData();
    form.append("_method", "PUT");

    if (payload.name) {
      form.append("name", payload.name);
    }

    if (payload.avatar) {
      const file = await imageToFormDataPart(payload.avatar, "avatar.jpg");
      form.append("avatar", file.blob, file.name);
    }

    const res = await api.post(`/users/${userId}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error };
  }
}

export async function deleteAvatar(
  userId: string,
): Promise<ServiceResult<true>> {
  try {
    await api.delete(`/users/${userId}/avatar`);
    return { success: true, data: true };
  } catch (error) {
    return { success: false, error };
  }
}
