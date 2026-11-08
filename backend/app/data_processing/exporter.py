import os
import pandas as pd
from typing import List, Dict, Any

def export_validation_report(issues: List[Dict[str, Any]], output_path: str) -> str:
    """
    Exports a detailed audit-ready CSV validation report containing all flagged issues.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    if not issues:
        df = pd.DataFrame(columns=["row_number", "field_name", "invalid_value", "error_message", "proposed_correction", "severity"])
    else:
        df = pd.DataFrame(issues)
    df.to_csv(output_path, index=False, encoding="utf-8")
    return output_path

def export_cleaned_dataset(valid_records: List[Dict[str, Any]], output_path: str) -> str:
    """
    Exports the validated and cleaned dataset as CSV for downstream analytics.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    # Strip internal keys like '_row_number'
    cleaned_rows = []
    for r in valid_records:
        cleaned_row = {k: v for k, v in r.items() if not k.startswith("_")}
        cleaned_rows.append(cleaned_row)

    df = pd.DataFrame(cleaned_rows)
    df.to_csv(output_path, index=False, encoding="utf-8")
    return output_path
