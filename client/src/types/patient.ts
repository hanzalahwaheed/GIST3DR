export type BoneType = "cancellous" | "cortical" | "nerve_canal";

export type ModelUrls = Record<BoneType, string | null>;
export type GifUrls = Record<BoneType, string | null>;

export interface PatientSummary {
  id: string;
  name: string;
  age: number;
  bone_density_gram_per_centimeter_sq: number | null;
  height_millimeter: number | null;
  width_millimeter: number | null;
  thickness_millimeter: number | null;
  area_millimeter_sq: number | null;
}

export interface PatientDetail extends PatientSummary {
  modal_urls: ModelUrls;
  gif_urls: GifUrls;
}

export interface ApiErrorResponse {
  error: string;
  detail?: unknown;
  status?: number;
}

export interface CreatePatientInput {
  name: string;
  age: number;
  dicomFile: File;
}

export interface CreatePatientFormState {
  name: string;
  age: string;
  dicomFile: File | null;
}
