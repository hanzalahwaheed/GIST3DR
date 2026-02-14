# AGENT.md

This file defines the baseline workflow for humans and coding agents working in this repository.

## Project Summary

The GIST-3DR project aims to revolutionize dental implant procedures by integrating cutting-edge technologies such as 3D Augmented Reality (AR) and advanced segmentation models. The primary objective is to automate and personalize implant generation, addressing critical issues like improper dimensions, nerve canal damage, and lack of regional visualization. By utilizing CT scan data, GIST-3DR generates detailed 3D models of oral anatomy, enabling clinicians to visualize, plan, and execute implant surgeries with precision.

## Repository Layout

- `server/`: FastAPI app, data model utilities, DICOM and model-processing logic.
- `client/`: Next.js app (App Router) and UI components.
- `assets/`: demo and architecture media.
- `README.md`: high-level project overview.
- `CONTRIBUTING.md`: contribution notes and basic local run steps.

## Local Development

### Backend (FastAPI)

```bash
cd server
poetry install
poetry run uvicorn main:app --reload
```

### Frontend (Next.js)

```bash
cd client
npm install
npm run dev
```

## Quality Checks

Run relevant checks before finishing changes:

- Backend formatting: `cd server && poetry run black .`
- Backend lint: `cd server && poetry run ruff check .`
- Frontend lint: `cd client && npm run lint`

If a check is skipped, explicitly state that in your handoff.

## Change Guidelines

- Keep edits scoped to the task; avoid unrelated refactors.
- Follow existing patterns in each area (FastAPI routes, Next.js app structure, current state/store usage).
- When API payloads or endpoint behavior change, update `server/API_DOCS.md`.
- For backend data-model changes, review related files under `server/database/schemas/` and `server/database/utils/`.
- For UI changes, verify affected routes under `client/src/app/` and components under `client/src/components/`.

## Validation Expectations

For non-trivial changes, validate both correctness and integration:

- Run at least one targeted backend check and one frontend check when both sides are touched.
- Smoke-test impacted flows manually (for example: auth, patient list/detail, upload/edit/delete paths).
- Document what was validated and what was not.

## Collaboration Notes

- Prefer small, reviewable diffs.
- Preserve unrelated local changes in the working tree.
- Call out assumptions, blockers, or missing environment prerequisites early.
