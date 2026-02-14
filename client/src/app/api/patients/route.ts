import { NextRequest, NextResponse } from "next/server";
import {
  fastApiFetch,
  FastApiProxyError,
  forwardAuthHeader,
  toApiErrorResponse,
} from "@/lib/server/fastapi";
import type { PatientSummary } from "@/types/patient";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 50;

function sanitizeLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_LIMIT;
  }

  const bounded = Math.trunc(parsed);
  if (bounded < 1) {
    return 1;
  }

  if (bounded > 100) {
    return 100;
  }

  return bounded;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const limit = sanitizeLimit(request.nextUrl.searchParams.get("limit"));

  try {
    const patients = await fastApiFetch<PatientSummary[]>(`/patient/?limit=${limit}`, {
      method: "GET",
      headers: {
        ...forwardAuthHeader(request.headers),
      },
    });

    return NextResponse.json(patients, { status: 200 });
  } catch (error) {
    const payload = toApiErrorResponse(error);
    const status = error instanceof FastApiProxyError ? error.status : 500;
    return NextResponse.json(payload, { status });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const incoming = await request.formData();
    const outgoing = new FormData();

    const name = incoming.get("name");
    const age = incoming.get("age");
    const dicom = incoming.get("dicom_file");

    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (typeof age !== "string" || Number.isNaN(Number(age)) || Number(age) <= 0) {
      return NextResponse.json({ error: "Valid age is required" }, { status: 400 });
    }

    if (!(dicom instanceof File)) {
      return NextResponse.json({ error: "DICOM file is required" }, { status: 400 });
    }

    outgoing.set("name", name.trim());
    outgoing.set("age", String(Math.trunc(Number(age))));
    outgoing.set("dicom_file", dicom, dicom.name || "upload.dcm");

    const createdPatient = await fastApiFetch<PatientSummary>("/patient/create", {
      method: "POST",
      headers: {
        ...forwardAuthHeader(request.headers),
      },
      body: outgoing,
    });

    return NextResponse.json(createdPatient, { status: 200 });
  } catch (error) {
    const payload = toApiErrorResponse(error);
    const status = error instanceof FastApiProxyError ? error.status : 500;
    return NextResponse.json(payload, { status });
  }
}
