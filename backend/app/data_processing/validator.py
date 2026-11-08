import math
import pandas as pd
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime

class DataValidationError:
    def __init__(
        self,
        row_number: int,
        field_name: str,
        invalid_value: Any,
        error_message: str,
        proposed_correction: Optional[Any] = None,
        severity: str = "error"
    ):
        self.row_number = row_number
        self.field_name = field_name
        self.invalid_value = str(invalid_value) if invalid_value is not None else ""
        self.error_message = error_message
        self.proposed_correction = str(proposed_correction) if proposed_correction is not None else None
        self.severity = severity

    def to_dict(self) -> Dict[str, Any]:
        return {
            "row_number": self.row_number,
            "field_name": self.field_name,
            "invalid_value": self.invalid_value,
            "error_message": self.error_message,
            "proposed_correction": self.proposed_correction,
            "severity": self.severity
        }

def validate_sales_contract(
    df: pd.DataFrame,
    existing_txn_ids: Optional[set] = None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Validates cleaned sales transactions against Fuji Kyuko Sales Contract.
    Returns: (valid_records, invalid_records, all_issues, summary_stats)
    """
    valid_records: List[Dict[str, Any]] = []
    invalid_records: List[Dict[str, Any]] = []
    all_issues: List[Dict[str, Any]] = []

    seen_ids = set(existing_txn_ids or [])
    current_dataset_ids = set()

    duplicate_count = 0
    missing_value_count = 0
    math_mismatch_count = 0

    for idx, row in df.iterrows():
        row_num = idx + 1  # 1-based indexing for business reporting
        row_issues: List[DataValidationError] = []
        row_dict = row.to_dict()

        # 1. Transaction ID
        txn_id = row.get("transaction_id")
        if pd.isna(txn_id) or not str(txn_id).strip():
            row_issues.append(DataValidationError(
                row_number=row_num,
                field_name="transaction_id",
                invalid_value=txn_id,
                error_message="Missing required transaction_id.",
                severity="error"
            ))
            missing_value_count += 1
        else:
            txn_str = str(txn_id).strip()
            if txn_str in seen_ids or txn_str in current_dataset_ids:
                row_issues.append(DataValidationError(
                    row_number=row_num,
                    field_name="transaction_id",
                    invalid_value=txn_str,
                    error_message=f"Duplicate transaction_id '{txn_str}' detected.",
                    severity="error"
                ))
                duplicate_count += 1
            else:
                current_dataset_ids.add(txn_str)

        # 2. Transaction Date
        txn_date = row.get("transaction_date")
        if pd.isna(txn_date) or txn_date is None:
            row_issues.append(DataValidationError(
                row_number=row_num,
                field_name="transaction_date",
                invalid_value=txn_date,
                error_message="Missing or invalid transaction_date format.",
                severity="error"
            ))
            missing_value_count += 1

        # 3. Product ID
        prod_id = row.get("product_id")
        if pd.isna(prod_id) or not str(prod_id).strip():
            row_issues.append(DataValidationError(
                row_number=row_num,
                field_name="product_id",
                invalid_value=prod_id,
                error_message="Missing required product_id.",
                severity="error"
            ))
            missing_value_count += 1

        # 4. Quantity (integer > 0)
        qty = row.get("quantity")
        qty_val = None
        if pd.isna(qty) or qty is None:
            row_issues.append(DataValidationError(
                row_number=row_num,
                field_name="quantity",
                invalid_value=qty,
                error_message="Missing quantity.",
                severity="error"
            ))
            missing_value_count += 1
        else:
            try:
                qty_val = int(qty)
                if qty_val <= 0:
                    row_issues.append(DataValidationError(
                        row_number=row_num,
                        field_name="quantity",
                        invalid_value=qty,
                        error_message="Quantity must be a positive integer greater than zero.",
                        severity="error"
                    ))
            except (ValueError, TypeError):
                row_issues.append(DataValidationError(
                    row_number=row_num,
                    field_name="quantity",
                    invalid_value=qty,
                    error_message=f"Invalid non-integer quantity value '{qty}'.",
                    severity="error"
                ))

        # 5. Unit Price (non-negative number)
        unit_price = row.get("unit_price")
        price_val = None
        if pd.isna(unit_price) or unit_price is None:
            row_issues.append(DataValidationError(
                row_number=row_num,
                field_name="unit_price",
                invalid_value=unit_price,
                error_message="Missing unit_price.",
                severity="error"
            ))
            missing_value_count += 1
        else:
            try:
                price_val = float(unit_price)
                if price_val < 0:
                    row_issues.append(DataValidationError(
                        row_number=row_num,
                        field_name="unit_price",
                        invalid_value=unit_price,
                        error_message="Unit price cannot be negative.",
                        severity="error"
                    ))
            except (ValueError, TypeError):
                row_issues.append(DataValidationError(
                    row_number=row_num,
                    field_name="unit_price",
                    invalid_value=unit_price,
                    error_message=f"Invalid numerical unit_price '{unit_price}'.",
                    severity="error"
                ))

        # 6. Total Amount (non-negative number)
        total_amt = row.get("total_amount")
        total_val = None
        if pd.isna(total_amt) or total_amt is None:
            row_issues.append(DataValidationError(
                row_number=row_num,
                field_name="total_amount",
                invalid_value=total_amt,
                error_message="Missing total_amount.",
                severity="error"
            ))
            missing_value_count += 1
        else:
            try:
                total_val = float(total_amt)
                if total_val < 0:
                    row_issues.append(DataValidationError(
                        row_number=row_num,
                        field_name="total_amount",
                        invalid_value=total_amt,
                        error_message="Total amount cannot be negative.",
                        severity="error"
                    ))
            except (ValueError, TypeError):
                row_issues.append(DataValidationError(
                    row_number=row_num,
                    field_name="total_amount",
                    invalid_value=total_amt,
                    error_message=f"Invalid numerical total_amount '{total_amt}'.",
                    severity="error"
                ))

        # 7. Mathematical Formula Check: total_amount == quantity * unit_price
        if qty_val is not None and price_val is not None and total_val is not None:
            expected_total = round(qty_val * price_val, 2)
            if abs(total_val - expected_total) > 0.01:
                row_issues.append(DataValidationError(
                    row_number=row_num,
                    field_name="total_amount",
                    invalid_value=total_val,
                    error_message=f"Formula mismatch: recorded total (¥{total_val:,.2f}) differs from quantity × unit_price (¥{expected_total:,.2f}).",
                    proposed_correction=expected_total,
                    severity="error"
                ))
                math_mismatch_count += 1

        # 8. Category
        category = row.get("category")
        if pd.isna(category) or not str(category).strip():
            row_issues.append(DataValidationError(
                row_number=row_num,
                field_name="category",
                invalid_value=category,
                error_message="Missing required business category.",
                severity="error"
            ))
            missing_value_count += 1

        # Format record for JSON serialization
        formatted_row = {}
        for k, v in row_dict.items():
            if pd.isna(v):
                formatted_row[k] = None
            elif isinstance(v, pd.Timestamp):
                formatted_row[k] = v.isoformat()
            else:
                formatted_row[k] = v

        if row_issues:
            issue_dicts = [iss.to_dict() for iss in row_issues]
            all_issues.extend(issue_dicts)
            formatted_row["_row_number"] = row_num
            formatted_row["_issues"] = issue_dicts
            invalid_records.append(formatted_row)
        else:
            formatted_row["_row_number"] = row_num
            valid_records.append(formatted_row)

    summary = {
        "contract": "sales",
        "total_records": len(df),
        "valid_records": len(valid_records),
        "invalid_records": len(invalid_records),
        "duplicate_records": duplicate_count,
        "missing_values": missing_value_count,
        "math_mismatches": math_mismatch_count,
        "total_issues": len(all_issues)
    }

    return valid_records, invalid_records, all_issues, summary

def validate_inventory_contract(
    df: pd.DataFrame
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
    """
    Validates cleaned inventory items against Fuji Kyuko Inventory Contract.
    """
    valid_records = []
    invalid_records = []
    all_issues = []

    missing_count = 0
    duplicate_count = 0
    seen_products = set()

    for idx, row in df.iterrows():
        row_num = idx + 1
        row_issues: List[DataValidationError] = []
        row_dict = row.to_dict()

        # Product ID
        pid = row.get("product_id")
        if pd.isna(pid) or not str(pid).strip():
            row_issues.append(DataValidationError(
                row_number=row_num, field_name="product_id", invalid_value=pid,
                error_message="Missing required product_id.", severity="error"
            ))
            missing_count += 1
        else:
            p_str = str(pid).strip()
            if p_str in seen_products:
                row_issues.append(DataValidationError(
                    row_number=row_num, field_name="product_id", invalid_value=p_str,
                    error_message=f"Duplicate product_id '{p_str}' in inventory dataset.", severity="warning"
                ))
                duplicate_count += 1
            else:
                seen_products.add(p_str)

        # Product Name
        pname = row.get("product_name")
        if pd.isna(pname) or not str(pname).strip():
            row_issues.append(DataValidationError(
                row_number=row_num, field_name="product_name", invalid_value=pname,
                error_message="Missing product_name.", severity="error"
            ))
            missing_count += 1

        # Available Quantity
        qty = row.get("available_quantity")
        if pd.isna(qty) or qty is None:
            row_issues.append(DataValidationError(
                row_number=row_num, field_name="available_quantity", invalid_value=qty,
                error_message="Missing available_quantity.", severity="error"
            ))
            missing_count += 1
        else:
            try:
                q = int(qty)
                if q < 0:
                    row_issues.append(DataValidationError(
                        row_number=row_num, field_name="available_quantity", invalid_value=qty,
                        error_message="Available quantity cannot be negative.", severity="error"
                    ))
            except (ValueError, TypeError):
                row_issues.append(DataValidationError(
                    row_number=row_num, field_name="available_quantity", invalid_value=qty,
                    error_message=f"Invalid integer available_quantity '{qty}'.", severity="error"
                ))

        # Reorder Level
        reorder = row.get("reorder_level", 10)
        try:
            r = int(reorder)
            if r < 0:
                row_issues.append(DataValidationError(
                    row_number=row_num, field_name="reorder_level", invalid_value=reorder,
                    error_message="Reorder level cannot be negative.", severity="error"
                ))
        except (ValueError, TypeError):
            row_issues.append(DataValidationError(
                row_number=row_num, field_name="reorder_level", invalid_value=reorder,
                error_message="Reorder level must be an integer.", severity="error"
            ))

        # Warehouse
        wh = row.get("warehouse")
        if pd.isna(wh) or not str(wh).strip():
            row_dict["warehouse"] = "Central Warehouse Fujiyoshida"  # Standard default if omitted

        formatted_row = {}
        for k, v in row_dict.items():
            formatted_row[k] = None if pd.isna(v) else v

        if row_issues:
            issue_dicts = [iss.to_dict() for iss in row_issues]
            all_issues.extend(issue_dicts)
            formatted_row["_row_number"] = row_num
            formatted_row["_issues"] = issue_dicts
            invalid_records.append(formatted_row)
        else:
            formatted_row["_row_number"] = row_num
            valid_records.append(formatted_row)

    summary = {
        "contract": "inventory",
        "total_records": len(df),
        "valid_records": len(valid_records),
        "invalid_records": len(invalid_records),
        "duplicate_records": duplicate_count,
        "missing_values": missing_count,
        "math_mismatches": 0,
        "total_issues": len(all_issues)
    }

    return valid_records, invalid_records, all_issues, summary
