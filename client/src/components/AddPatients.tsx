"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ThreeDots } from "react-loader-spinner";
import { createPatient } from "@/api/patient";
import { getOptionalAuthToken } from "@/lib/client/auth";
import type { CreatePatientFormState } from "@/types/patient";

interface FormErrors {
  name?: string;
  age?: string;
  dicom_file?: string;
}

const INITIAL_FORM: CreatePatientFormState = {
  name: "",
  age: "",
  dicomFile: null,
};

export default function AddPatient() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreatePatientFormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isSubmitDisabled = useMemo(() => loading, [loading]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const { id, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0] ?? null;
    setFormData((prev) => ({
      ...prev,
      dicomFile: file,
    }));
  }

  function validateForm(): boolean {
    const validationErrors: FormErrors = {};
    const numericAge = Number(formData.age);

    if (!formData.name.trim()) {
      validationErrors.name = "Name is required.";
    }

    if (!Number.isFinite(numericAge) || numericAge <= 0) {
      validationErrors.age = "Please enter a valid age.";
    }

    if (!formData.dicomFile) {
      validationErrors.dicom_file = "DICOM file is required.";
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await createPatient(
        {
          name: formData.name.trim(),
          age: Number(formData.age),
          dicomFile: formData.dicomFile as File,
        },
        getOptionalAuthToken(),
      );

      setFormData(INITIAL_FORM);
      setErrors({});
      router.push("/");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to upload patient. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="border-0 p-4 pt-0 md:p-8">
        {loading ? (
          <ThreeDots
            visible
            height="80"
            width="80"
            color="#4fa94d"
            radius="9"
            ariaLabel="three-dots-loading"
          />
        ) : (
          <form className="my-8 w-full" onSubmit={handleSubmit}>
            {submitError ? (
              <div className="mb-4 rounded-md border border-red-400/60 bg-red-500/10 p-3 text-sm text-red-300">
                {submitError}
              </div>
            ) : null}

            <div className="card mb-4 flex w-full flex-col space-y-1 rounded-md border-2 border-[#7fee64] p-2 md:flex-row md:space-x-2 md:space-y-0">
              <label htmlFor="name" className="shrink-0 text-lg">
                Name :
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full appearance-none border-none bg-transparent text-base font-medium outline-none focus:ring-0"
              />
            </div>
            {errors.name ? <p className="-mt-3 mb-3 text-red-500">{errors.name}</p> : null}

            <div className="card mb-4 flex flex-col space-y-1 rounded-md border-2 border-[#7fee64] p-2 md:flex-row md:space-x-2 md:space-y-0">
              <label htmlFor="age" className="shrink-0 text-lg">
                Age :
              </label>
              <input
                id="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                className="w-full appearance-none border-none bg-transparent text-base font-medium outline-none focus:ring-0"
              />
            </div>
            {errors.age ? <p className="-mt-3 mb-3 text-red-500">{errors.age}</p> : null}

            <div className="card mb-4 flex flex-col space-y-1 rounded-md border-2 border-[#7fee64] p-2 md:flex-row md:space-x-2 md:space-y-0">
              <label htmlFor="dicom_file" className="text-lg">
                DICOM File :
              </label>
              <input
                id="dicom_file"
                type="file"
                onChange={handleFileChange}
                accept=".dcm"
                className="appearance-none border-none bg-transparent text-base font-medium outline-none focus:ring-0"
              />
            </div>
            {errors.dicom_file ? <p className="-mt-3 mb-3 text-red-500">{errors.dicom_file}</p> : null}

            <div className="flex w-full justify-end">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="card flex items-center gap-2 rounded-full border-[#7fee64] bg-[#7fee64] p-2 px-4 text-sm text-[#1b1b1b] hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
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
                Add
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
