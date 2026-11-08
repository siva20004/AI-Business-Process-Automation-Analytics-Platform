import os
import json
import pandas as pd
from typing import Dict, Any, List, Tuple

SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".json"]
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

def parse_file(file_path: str) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Parses an uploaded file (CSV, XLSX, XLS, JSON) into a pandas DataFrame
    and extracts metadata (detected columns, types, null counts, total rows).
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"File size ({file_size} bytes) exceeds 50MB limit.")

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file format '{ext}'. Supported formats: CSV, XLSX, XLS, JSON")

    df: pd.DataFrame
    if ext == ".csv":
        # Handle UTF-8 with fallback for Japanese Shift-JIS / CP932
        try:
            df = pd.read_csv(file_path, encoding="utf-8")
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(file_path, encoding="cp932")
            except Exception:
                df = pd.read_csv(file_path, encoding="latin1")
    elif ext in [".xlsx", ".xls"]:
        df = pd.read_excel(file_path)
    elif ext == ".json":
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            df = pd.DataFrame(data)
        elif isinstance(data, dict):
            # If wrapped in a key like {"records": [...]} or {"data": [...]}
            for key in ["records", "data", "transactions", "items"]:
                if key in data and isinstance(data[key], list):
                    df = pd.DataFrame(data[key])
                    break
            else:
                df = pd.DataFrame([data])
        else:
            raise ValueError("Invalid JSON format. Expected an array of records or object.")
    else:
        raise ValueError(f"Unsupported extension: {ext}")

    # Inspect columns and data types
    columns_info = []
    for col in df.columns:
        series = df[col]
        dtype = str(series.dtype)
        inferred_type = "string"
        if "int" in dtype:
            inferred_type = "integer"
        elif "float" in dtype:
            inferred_type = "float"
        elif "datetime" in dtype:
            inferred_type = "datetime"
        elif "bool" in dtype:
            inferred_type = "boolean"
        else:
            # Check if strings look like dates or numbers
            sample_non_null = series.dropna().head(50)
            if len(sample_non_null) > 0:
                try:
                    import warnings
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        pd.to_datetime(sample_non_null, errors="raise")
                    inferred_type = "datetime"
                except Exception:
                    try:
                        pd.to_numeric(sample_non_null, errors="raise")
                        inferred_type = "float"
                    except Exception:
                        inferred_type = "string"

        columns_info.append({
            "name": str(col),
            "inferred_type": inferred_type,
            "raw_dtype": dtype,
            "null_count": int(series.isnull().sum()),
            "unique_count": int(series.nunique()),
        })

    metadata = {
        "file_name": os.path.basename(file_path),
        "file_format": ext.replace(".", ""),
        "file_size_bytes": file_size,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": columns_info,
        "preview_rows": df.head(10).fillna("").to_dict(orient="records"),
    }

    return df, metadata
