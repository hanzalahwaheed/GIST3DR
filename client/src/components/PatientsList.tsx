"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThreeDots } from "react-loader-spinner";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalTrigger,
} from "@/components/ui/animated-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddPatient from "@/components/AddPatients";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { getAllPatients } from "@/api/patient";
import { getOptionalAuthToken } from "@/lib/client/auth";
import type { PatientSummary } from "@/types/patient";

function formatMeasurement(value: number | null, digits = 2): string {
  if (value === null || Number.isNaN(value)) {
    return "N/A";
  }

  return value.toFixed(digits);
}

export function PatientsList() {
  const router = useRouter();
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPatients(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const response = await getAllPatients(50, getOptionalAuthToken());
      setPatients(response);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load patients.";
      setError(message);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPatients();
  }, []);

  function handleUserRedirect(id: string): void {
    router.push(`/user/${id}`);
  }

  return (
    <div className="z-30">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-3xl text-white">All Patients</h1>
        <Modal>
          <ModalTrigger className="card flex items-center gap-2 rounded-full border-[#7fee64] bg-[#7fee64] p-6 py-4 text-sm text-[#1b1b1b] hover:scale-110">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="icon icon-tabler icon-tabler-circle-plus"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
              <path d="M9 12h6" />
              <path d="M12 9v6" />
            </svg>
            Add Patient
          </ModalTrigger>

          <ModalBody className="border-2 border-stone-500 bg-[#080b13]">
            <BackgroundBeams />
            <ModalContent>
              <AddPatient />
            </ModalContent>
          </ModalBody>
        </Modal>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-400/60 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="my-4 flex justify-center">
          <ThreeDots height="80" width="80" color="white" ariaLabel="loading" />
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="card text-white">
                <TableHead>Name</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Bone Density</TableHead>
                <TableHead>Height</TableHead>
                <TableHead>Width</TableHead>
                <TableHead>Thickness</TableHead>
                <TableHead>Area</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.length === 0 ? (
                <TableRow className="h-[50vh]">
                  <TableCell colSpan={7} className="align-middle text-center text-xl text-white">
                    No patients found. Add a patient to get started.
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="w-full cursor-pointer text-white hover:bg-gray-600"
                    onClick={() => handleUserRedirect(patient.id)}
                  >
                    <TableCell>{patient.name}</TableCell>
                    <TableCell>{patient.age}</TableCell>
                    <TableCell>{formatMeasurement(patient.bone_density_gram_per_centimeter_sq)}</TableCell>
                    <TableCell>{formatMeasurement(patient.height_millimeter)}</TableCell>
                    <TableCell>{formatMeasurement(patient.width_millimeter)}</TableCell>
                    <TableCell>{formatMeasurement(patient.thickness_millimeter)}</TableCell>
                    <TableCell>{formatMeasurement(patient.area_millimeter_sq)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
