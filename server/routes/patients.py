import uuid
from typing import List, Annotated, Optional
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.params import Query
from pydicom.filebase import DicomBytesIO
from sqlalchemy import select
from sqlmodel import Session
from database.schemas.tables import Patient
from utils.exporter import OBJExporter, masks_to_gif
from utils.dicom import read_dicom_slices
from database.utils.storage import check_file_exists
from database.utils.connect import DBConfig
from utils.model import masks_generator_pipeline
from utils.schema import PatientIndividual
from utils.setup import setup_logger

load_dotenv()


def get_session():
    with Session(engine) as session:
        yield session


db_config = DBConfig()
engine = db_config.connect_to_database()
supabase = db_config.connect_to_storage()
logger = setup_logger("patients", "logs/patients.log")

router = APIRouter(
    prefix="/patient", tags=["patient"], responses={404: {"description": "Not found"}}
)


SessionDep = Annotated[Session, Depends(get_session)]


@router.get("/")
async def get_patients(
    session: SessionDep, limit: Annotated[int, Query(le=100)] = 10
) -> List[Patient]:
    """Get all patients with pagination"""
    db_patients = session.exec(select(Patient).limit(limit)).all()
    patients = [db_patient[0] for db_patient in db_patients]
    logger.info(f"Retrieved {len(patients)} patients")
    return patients


@router.get("/{patient_id}")
async def get_patient(patient_id: str, session: SessionDep) -> PatientIndividual:
    """Get a specific patient by ID"""
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient_data = PatientIndividual(
        id=str(patient.id),
        name=patient.name,
        age=patient.age,
        bone_density_gram_per_centimeter_sq=patient.bone_density_gram_per_centimeter_sq,
        height_millimeter=patient.height_millimeter,
        width_millimeter=patient.width_millimeter,
        thickness_millimeter=patient.thickness_millimeter,
        area_millimeter_sq=patient.area_millimeter_sq,
        modal_urls={
            "cancellous": (
                supabase.storage.from_("bone_models").create_signed_url(
                    f"{patient_id}/cancellous.obj", 12000
                )["signedURL"]
                if check_file_exists(
                    supabase, "bone_models", f"{patient_id}/cancellous.obj"
                )
                else None
            ),
            "cortical": (
                supabase.storage.from_("bone_models").create_signed_url(
                    f"{patient_id}/cortical.obj", 12000
                )["signedURL"]
                if check_file_exists(
                    supabase, "bone_models", f"{patient_id}/cortical.obj"
                )
                else None
            ),
            "nerve_canal": (
                supabase.storage.from_("bone_models").create_signed_url(
                    f"{patient_id}/nerve_canal.obj", 12000
                )["signedURL"]
                if check_file_exists(
                    supabase, "bone_models", f"{patient_id}/nerve_canal.obj"
                )
                else None
            ),
        },
        gif_urls={
            "cancellous": (
                supabase.storage.from_("bone_models").create_signed_url(
                    f"{patient_id}/cancellous.gif", 12000
                )["signedURL"]
                if check_file_exists(
                    supabase, "bone_models", f"{patient_id}/cancellous.gif"
                )
                else None
            ),
            "cortical": (
                supabase.storage.from_("bone_models").create_signed_url(
                    f"{patient_id}/cortical.gif", 12000
                )["signedURL"]
                if check_file_exists(
                    supabase, "bone_models", f"{patient_id}/cortical.gif"
                )
                else None
            ),
            "nerve_canal": (
                supabase.storage.from_("bone_models").create_signed_url(
                    f"{patient_id}/nerve_canal.gif", 12000
                )["signedURL"]
                if check_file_exists(
                    supabase, "bone_models", f"{patient_id}/nerve_canal.gif"
                )
                else None
            ),
        },
    )

    logger.info("Retrieved patient")

    return patient_data


@router.post("/create", response_model=Patient)
async def create_patient(
    session: SessionDep,
    name: str = Form(...),
    age: int = Form(...),
    dicom_file: UploadFile = File,
) -> Patient:
    """Create a new patient"""

    dicom_bytes = await dicom_file.read()
    dicom_buffer = DicomBytesIO(dicom_bytes)
    slices = read_dicom_slices(dicom_buffer)
    logger.info(f"Read {len(slices)} slices from DICOM file")

    masks, measurements = masks_generator_pipeline(slices)
    logger.info("Generated masks and measurements")

    patient = Patient(name=name, age=age)
    patient.id = str(uuid4())
    patient.height_millimeter = round(
        sum(measurements[2]["height"]) / len(measurements[2]["height"]), 2
    )
    patient.width_millimeter = round(
        sum(measurements[2]["width"]) / len(measurements[2]["width"]), 2
    )
    patient.area_millimeter_sq = round(
        sum(measurements[2]["area"]) / len(measurements[2]["area"]), 2
    ).item()
    patient.thickness_millimeter = round(len(slices) * 0.6, 2)  # 2mm per slice
    session.add(patient)

    obj_exporter = OBJExporter()
    try:
        label_names = ["cancellous", "cortical", "nerve_canal"]
        for label, mask_list in masks.items():
            if mask_list:
                obj_content = obj_exporter.save_multiple_masks_to_obj(mask_list)
                obj_file = f"{patient.id}/{label_names[label-1]}.obj"
                supabase.storage.from_("bone_models").upload(
                    path=obj_file,
                    file=obj_content.encode(),
                    file_options={"contentType": "application/x-tgif"},
                )

                gif_content = masks_to_gif(mask_list, label)
                gif_file = f"{patient.id}/{label_names[label-1]}.gif"
                supabase.storage.from_("bone_models").upload(
                    path=gif_file,
                    file=gif_content,
                    file_options={"contentType": "image/gif"},
                )

        logger.info("Saved OBJ and GIF files to storage")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to save OBJ files: {e}",
        )

    session.commit()
    session.refresh(patient)
    logger.info("Created patient")

    return patient


@router.delete("/{patient_id}")
async def delete_patient(patient_id: str, session: SessionDep):
    try:
        patient = session.get(Patient, patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")

        try:
            storage_response = supabase.storage.from_("bone_models").list(patient_id)

            if isinstance(storage_response, list):
                file_paths = [
                    f"{patient_id}/{file['name']}" for file in storage_response
                ]

                if file_paths:
                    supabase.storage.from_("bone_models").remove(file_paths)

            supabase.storage.from_("bone_models").remove([f"{patient_id}"])

        except Exception as storage_error:
            logger.error(
                f"Storage deletion error for patient {patient_id}: {str(storage_error)}"
            )

        session.delete(patient)
        session.commit()

        logger.info(f"Successfully deleted patient {patient_id} and associated files")
        return {"message": "Patient deleted successfully"}

    except Exception as e:
        session.rollback()
        logger.error(f"Error deleting patient {patient_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting patient: {str(e)}")


@router.put("/{patient_id}")
async def update_patient(
    session: SessionDep,
    name: str = Form(...),
    age: int = Form(...),
    dicom_file: Optional[UploadFile] = File(None),
) -> Patient:
    """
    Update a patient by ID

    Args:
        auth: Authentication dependency
        session: Database session dependency
        patient: Patient model from path parameter
        dicom_file: Optional DICOM file upload

    Returns:
        Updated Patient object

    Raises:
        HTTPException: If patient not found or processing fails
    """
    # Validate patient exists
    patient = Patient(id=id, name=name, age=age)
    existing_patient = session.get(Patient, patient.id)
    if not existing_patient:
        logger.error(f"Patient {patient.id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )

    if patient.name:
        existing_patient.name = patient.name

    if patient.age:
        existing_patient.age = patient.age

    # Process DICOM file if provided
    if dicom_file:
        try:
            dicom_bytes = await dicom_file.read()
            dicom_buffer = DicomBytesIO(dicom_bytes)
            slices = read_dicom_slices(dicom_buffer)
            logger.info(f"Read {len(slices)} slices from DICOM file")

            masks, measurements = masks_generator_pipeline(slices)
            logger.info("Generated masks and measurements")

            existing_patient.bone_density_gram_per_centimeter_sq = (
                patient.bone_density_gram_per_centimeter_sq
            )
            existing_patient.height_millimeter = round(
                sum(measurements[2]["height"]) / len(measurements[2]["height"]), 2
            )
            existing_patient.width_millimeter = round(
                sum(measurements[2]["width"]) / len(measurements[2]["width"]), 2
            )
            existing_patient.area_millimeter_sq = round(
                sum(measurements[2]["area"]) / len(measurements[2]["area"]), 2
            ).item()
            existing_patient.thickness_millimeter = round(
                len(slices) * 0.6, 2
            )  # 2mm per slice

            obj_exporter = OBJExporter()
            label_names = ["cancellous", "cortical", "nerve_canal"]

            for label, mask_list in masks.items():
                if not mask_list:
                    continue

                obj_file = f"{patient.id}/{label_names[label - 1]}.obj"

                try:
                    obj_content = obj_exporter.save_multiple_masks_to_obj(mask_list)
                    supabase.storage.from_("bone_models").update(
                        path=obj_file,
                        file=obj_content.encode(),
                        file_options={"contentType": "application/x-tgif"},
                    )

                    gif_content = masks_to_gif(mask_list, label)
                    gif_file = f"{patient.id}/{label_names[label-1]}.gif"
                    supabase.storage.from_("bone_models").upload(
                        path=gif_file,
                        file=gif_content,
                        file_options={"contentType": "image/gif"},
                    )

                except Exception as e:
                    logger.error(f"Failed to save OBJ file {obj_file}: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to save OBJ file: {str(e)}",
                    )

            logger.info("Saved OBJ files to storage")

            session.commit()
            session.refresh(existing_patient)

        except Exception as e:
            logger.error(f"Failed to process DICOM update: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process patient update: {str(e)}",
            )

    logger.info(f"Successfully updated patient {patient.id}")
    return existing_patient
