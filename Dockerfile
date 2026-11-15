# ============================================================
# NavX Arena — Multi-stage Docker Build
# Result: single container with .NET 10 + Python 3 + React UI
# No Python or Node installation needed on the host machine.
# ============================================================

# ── Stage 1: Build the React frontend ────────────────────────
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
COPY src/frontend/package*.json ./
RUN npm ci --silent

COPY src/frontend/ ./
RUN npm run build
# Output: /frontend/dist/

# ── Stage 2: Build the .NET backend ──────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-builder

WORKDIR /build

# Restore dependencies first (layer cache)
COPY NavX.slnx ./
COPY src/backend/ ./src/backend/

RUN dotnet restore src/backend/NavX.Api/NavX.Api.csproj

# Publish release build
RUN dotnet publish src/backend/NavX.Api/NavX.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ── Stage 3: Runtime image ───────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

# Install Python 3 (stdlib only — no pip packages needed)
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the published .NET app
COPY --from=backend-builder /app/publish ./

# Copy the React build into wwwroot so .NET serves it as static files
COPY --from=frontend-builder /frontend/dist ./wwwroot/

# Copy the Python Algorithm Engine (all .py files, no bytecode)
COPY src/backend/NavX.AlgorithmEngine/ ./NavX.AlgorithmEngine/

# ── Environment ──────────────────────────────────────────────
# Use the system python3 (installed above)
ENV PythonEngine__Executable=python3
# Absolute path inside the container
ENV PythonEngine__EnginePath=/app/NavX.AlgorithmEngine/main.py

ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 5000

ENTRYPOINT ["dotnet", "NavX.Api.dll"]
