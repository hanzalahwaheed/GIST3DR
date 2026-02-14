from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routes import patients, users

load_dotenv()

app = FastAPI(
    title="GIST3DR API",
    description="Dental data analytics and implant generation",
    version="0.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router)
app.include_router(users.router)


@app.get("/", response_class=JSONResponse)
async def read_root():
    return {"status": "Healthy"}
