"""Adapters package exports."""

from engine.adapters.cli import run_cli
from engine.adapters.json_io import parse_request, serialize_response, serialize_error

__all__ = ["run_cli", "parse_request", "serialize_response", "serialize_error"]
