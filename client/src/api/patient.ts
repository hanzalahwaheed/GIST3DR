import type {
  ApiErrorResponse,
  CreatePatientInput,
  PatientDetail,
  PatientSummary,
} from "@/types/patient";

const PATIENTS_ENDPOINT = "/api/patients";

async function readJson<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function buildAuthHeader(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    const data = await readJson<T>(response);
    if (data === null) {
      throw new Error("Empty JSON response from API");
    }
    return data;
  }

  const apiError = await readJson<ApiErrorResponse>(response);
  if (apiError?.error) {
    throw new Error(apiError.error);
  }

  throw new Error(`Request failed with status ${response.status}`);
}

export async function getAllPatients(limit = 50, token?: string): Promise<PatientSummary[]> {
  const response = await fetch(`${PATIENTS_ENDPOINT}?limit=${encodeURIComponent(String(limit))}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      ...buildAuthHeader(token),
    },
  });

  return handleResponse<PatientSummary[]>(response);
}

export async function getPatient(patientId: string, token?: string): Promise<PatientDetail> {
  const response = await fetch(`${PATIENTS_ENDPOINT}/${encodeURIComponent(patientId)}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      ...buildAuthHeader(token),
    },
  });

  return handleResponse<PatientDetail>(response);
}

export async function createPatient(input: CreatePatientInput, token?: string): Promise<PatientSummary> {
  const data = new FormData();
  data.set("name", input.name);
  data.set("age", String(Math.trunc(input.age)));
  data.set("dicom_file", input.dicomFile, input.dicomFile.name);

  const response = await fetch(PATIENTS_ENDPOINT, {
    method: "POST",
    body: data,
    headers: {
      ...buildAuthHeader(token),
    },
  });

  return handleResponse<PatientSummary>(response);
}
