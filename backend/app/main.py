from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, students, faculties, subjects, topics, batches, courses, course_content, tests, course_content_presigned
from app.database import Base, engine
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

import traceback
import sys
import os


app = FastAPI(title="EduPlatform LMS API")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
# app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# load_dotenv()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
# Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(students.router, prefix="/students", tags=["students"])
app.include_router(faculties.router, prefix="/faculties", tags=["faculties"])
app.include_router(subjects.router, prefix="/subjects",
                   tags=["subjects"])
app.include_router(topics.router, prefix="/topics", tags=["topics"])
app.include_router(batches.router, prefix="/batches", tags=["batches"])
app.include_router(courses.router, prefix="/courses", tags=["Courses"])
app.include_router(course_content.router,
                   prefix="/course-contents", tags=["CourseContents"])
app.include_router(tests.router, prefix="/tests", tags=["Tests"])
app.include_router(course_content_presigned.router,
                   prefix="/course-contents", tags=["CourseContents"])


@app.get("/")
async def root():
    return {"message": "EduPlatform LMS API"}


# Development-only rich error responses
DEBUG = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Return validation errors with request context. Rich output only in DEBUG."""
    payload = {"detail": exc.errors()}
    if DEBUG:
        try:
            body = await request.body()
        except Exception:
            body = None
        payload["debug"] = {
            "path": str(request.url),
            "method": request.method,
            "body": body.decode() if isinstance(body, (bytes, bytearray)) else body,
        }
    return JSONResponse(status_code=422, content=payload)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all handler that includes traceback details in DEBUG mode."""
    if DEBUG:
        exc_type, exc_value, tb = sys.exc_info()
        frames = traceback.extract_tb(tb) if tb else []
        trace = [
            {
                "file": f.filename,
                "line": f.lineno,
                "function": f.name,
                "text": f.line,
            }
            for f in frames
        ]
        content = {
            "message": str(exc),
            "detail": {
                "path": str(request.url),
                "method": request.method,
                "exception_type": exc_type.__name__ if exc_type else None,
                "traceback": trace,
            },
        }
    else:
        content = {"detail": "Internal Server Error"}
    return JSONResponse(status_code=500, content=content)
