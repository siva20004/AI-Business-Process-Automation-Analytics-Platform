import re
import pandas as pd
from typing import Dict, Any, List, Tuple

STANDARD_CATEGORIES = {
    "transport": "Transportation",
    "transportation": "Transportation",
    "bus": "Transportation",
    "rail": "Transportation",
    "railway": "Transportation",
    "train": "Transportation",
    "amuse": "Amusement",
    "amusement": "Amusement",
    "fuji-q": "Amusement",
    "fujiq": "Amusement",
    "park": "Amusement",
    "hotel": "Hotel",
    "hospitality": "Hotel",
    "resort": "Hotel",
    "stay": "Hotel",
    "tour": "Tourism",
    "tourism": "Tourism",
    "ropeway": "Tourism",
    "boat": "Tourism",
    "cruise": "Tourism",
    "sightseeing": "Tourism",
    "food": "Food",
    "dining": "Food",
    "restaurant": "Food",
    "kaiseki": "Food",
    "noodle": "Food",
    "retail": "Retail",
    "shop": "Retail",
    "souvenir": "Retail",
    "gift": "Retail",
    "wine": "Retail"
}

def clean_column_name(name: str) -> str:
    name = str(name).strip().lower()
    name = re.sub(r"[^\w\s]", "_", name)
    name = re.sub(r"\s+", "_", name)
    name = re.sub(r"_+", "_", name)
    return name.strip("_")

def clean_dataframe(
    df: pd.DataFrame,
    column_mapping: Dict[str, str] = None
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Cleans DataFrame:
    1. Trims whitespace from string cells and column headers.
    2. Maps column names according to user mapping or normalized snake_case.
    3. Normalizes dates into ISO format.
    4. Cleans numeric fields (removes currency symbols '¥', '$', commas).
    5. Normalizes business category values against Fuji Kyuko standard taxonomy.
    """
    operations_log: List[str] = []
    cleaned_df = df.copy()

    # 1. Normalize Column Names
    if column_mapping:
        cleaned_df = cleaned_df.rename(columns=column_mapping)
        operations_log.append(f"Applied user column mapping for {len(column_mapping)} fields.")
    else:
        new_cols = {col: clean_column_name(col) for col in cleaned_df.columns}
        cleaned_df = cleaned_df.rename(columns=new_cols)
        operations_log.append("Normalized column names to lower_snake_case format.")

    # 2. Trim string whitespace
    string_cols = [c for c in cleaned_df.columns if pd.api.types.is_string_dtype(cleaned_df[c]) or pd.api.types.is_object_dtype(cleaned_df[c])]
    for col in string_cols:
        cleaned_df[col] = cleaned_df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
    if len(string_cols) > 0:
        operations_log.append(f"Trimmed leading/trailing whitespace across {len(string_cols)} text columns.")

    # 3. Clean numeric fields if strings have currency or commas
    for col in cleaned_df.columns:
        if any(term in col for term in ["price", "amount", "cost", "quantity", "level", "count"]):
            if cleaned_df[col].dtype == object:
                cleaned_df[col] = cleaned_df[col].astype(str).str.replace("¥", "", regex=False)
                cleaned_df[col] = cleaned_df[col].str.replace("$", "", regex=False)
                cleaned_df[col] = cleaned_df[col].str.replace(",", "", regex=False).str.strip()
                cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
                operations_log.append(f"Cleaned currency formatting and converted '{col}' to numeric.")

    # 4. Normalize dates
    for col in cleaned_df.columns:
        if any(term in col for term in ["date", "time", "timestamp"]):
            try:
                parsed_dates = pd.to_datetime(cleaned_df[col], errors="coerce", utc=True)
                cleaned_df[col] = parsed_dates
                operations_log.append(f"Standardized '{col}' into ISO 8601 UTC datetimes.")
            except Exception:
                pass

    # 5. Normalize Category names
    if "category" in cleaned_df.columns:
        def match_cat(val):
            if not isinstance(val, str) or not val.strip():
                return val
            key = val.strip().lower()
            for pattern, standard in STANDARD_CATEGORIES.items():
                if pattern in key:
                    return standard
            return val.title()

        cleaned_df["category"] = cleaned_df["category"].apply(match_cat)
        operations_log.append("Normalized business segment categories to Fuji Kyuko divisional taxonomy.")

    return cleaned_df, operations_log
