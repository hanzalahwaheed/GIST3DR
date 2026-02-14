"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ThreeDots } from "react-loader-spinner";
import { cn } from "@/lib/utils";
import { getPatient } from "@/api/patient";
import { getOptionalAuthToken } from "@/lib/client/auth";
import type { BoneType, ModelUrls, PatientDetail } from "@/types/patient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Screw3D from "@/components/models/screw-3d";
import Bone3D from "@/components/models/bone-3d";

interface BoneTypeSelectorProps {
  selectedType: BoneType;
  onTypeChange: (boneType: BoneType) => void;
  availableTypes: ModelUrls;
}

function formatDimension(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return `${value.toFixed(2)}mm`;
}

function BoneTypeSelector({
  selectedType,
  onTypeChange,
  availableTypes,
}: BoneTypeSelectorProps) {
  const entries = Object.entries(availableTypes) as Array<[BoneType, string | null]>;

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([type, url]) => (
        <Button
          key={type}
          variant="outline"
          onClick={() => onTypeChange(type)}
          disabled={!url}
          className={cn(
            "text-sm transition-transform duration-200 hover:scale-105",
            selectedType === type && "bg-white text-black",
          )}
        >
          {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
        </Button>
      ))}
    </div>
  );
}

export default function UserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const patientId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoneType, setSelectedBoneType] = useState<BoneType>("cancellous");

  useEffect(() => {
    async function loadPatientData(): Promise<void> {
      if (!patientId) {
        setError("Missing patient ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getPatient(patientId, getOptionalAuthToken());
        setPatient(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load patient data.");
      } finally {
        setLoading(false);
      }
    }

    void loadPatientData();
  }, [patientId]);

  const selectedModelPath = useMemo(() => {
    if (!patient) {
      return null;
    }
    return patient.modal_urls[selectedBoneType] ?? null;
  }, [patient, selectedBoneType]);

  function handleARView(): void {
    if (!patient) {
      return;
    }

    const screwHeight = patient.height_millimeter ?? 0;
    const screwRadius = patient.width_millimeter ?? 0;

    router.push(`/user/${patient.id}/ar?height=${encodeURIComponent(String(screwHeight))}&radius=${encodeURIComponent(String(screwRadius))}`);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ThreeDots height="80" width="80" color="white" ariaLabel="loading" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex h-screen items-center justify-center">
        {error ?? "No user data found."}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 p-4">
      <Card className="flex w-full flex-col items-center gap-2 p-4 sm:flex-row sm:gap-4">
        <h1 className="text-xl font-bold sm:text-2xl">{patient.name}</h1>
        <div className="flex flex-wrap gap-2 text-sm sm:gap-4">
          <p>Screw Height: {formatDimension(patient.height_millimeter)}</p>
          <p>Screw Width: {formatDimension(patient.width_millimeter)}</p>
        </div>
        <Badge className="text-sm sm:ml-auto">Age: {patient.age}</Badge>
      </Card>

      <div className="card flex min-h-[80vh] w-full flex-col items-center gap-4 rounded-md p-4 lg:flex-row">
        <div className="h-[300px] w-full lg:h-full lg:w-1/3">
          <Card className="p-1">
            <Screw3D
              screwHeight={patient.height_millimeter ?? 0}
              screwRadius={patient.width_millimeter ?? 0}
            />
          </Card>
          <Button
            variant="outline"
            onClick={handleARView}
            className="mx-auto mt-3 block w-full bg-white text-black transition-transform duration-200 hover:scale-105 sm:w-auto"
          >
            View in AR
          </Button>
        </div>

        <div className="flex h-[400px] w-full flex-col items-center gap-4 lg:h-full lg:w-2/3">
          <Bone3D modelPath={selectedModelPath} />

          <BoneTypeSelector
            selectedType={selectedBoneType}
            onTypeChange={setSelectedBoneType}
            availableTypes={patient.modal_urls}
          />
        </div>
      </div>
    </div>
  );
}
