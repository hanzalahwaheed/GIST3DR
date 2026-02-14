import { NextRequest, NextResponse } from "next/server";
import {
  fastApiFetch,
  FastApiProxyError,
  forwardAuthHeader,
  toApiErrorResponse,
} from "@/lib/server/fastapi";
import type { PatientDetail } from "@/types/patient";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: patientId } = await context.params;

  if (!patientId) {
    return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
  }

  try {
    const patient = await fastApiFetch<PatientDetail>(`/patient/${encodeURIComponent(patientId)}`, {
      method: "GET",
      headers: {
        ...forwardAuthHeader(request.headers),
      },
    });

    return NextResponse.json(patient, { status: 200 });
  } catch (error) {
    const payload = toApiErrorResponse(error);
    const status = error instanceof FastApiProxyError ? error.status : 500;
    return NextResponse.json(payload, { status });
  }
}
