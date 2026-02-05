# ────────────────────────────────────────────
# 1. Base Image
# ────────────────────────────────────────────
FROM python:3.11-slim AS base

# Prevent Python from writing *.pyc files & enable buffer flushing
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ────────────────────────────────────────────
# 2. System Dependencies (build essentials)
# ────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ────────────────────────────────────────────
# 3. Create working directory
# ────────────────────────────────────────────
WORKDIR /app

# ────────────────────────────────────────────
# 4. Install dependencies separately (cache layer)
# ────────────────────────────────────────────
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# ────────────────────────────────────────────
# 5. Copy full backend
# ────────────────────────────────────────────
COPY . .

# ────────────────────────────────────────────
# 6. Expose port
# ────────────────────────────────────────────
EXPOSE 8000

# ────────────────────────────────────────────
# 7. Run FastAPI (production)
# ────────────────────────────────────────────
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
