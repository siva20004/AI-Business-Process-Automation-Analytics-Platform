import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.all_models import (
    BusinessTransaction,
    InventoryRecord,
    AnomalyDetection,
    AuditLog
)

logger = logging.getLogger("fuji_flow.anomaly")

class AnomalyEngine:
    """
    Production-grade AI & Statistical Anomaly Detection Engine for Fuji Kyuko Co., Ltd.
    Strict Real-Data Mandate: Detects anomalies purely from actual committed database records.
    Never invents or fabricates random alerts.
    """

    @staticmethod
    def detect_transaction_anomalies(
        db: Session,
        z_threshold: float = 2.5,
        contamination: str = "auto"
    ) -> List[Dict[str, Any]]:
        """
        Runs dual statistical (Z-Score + IQR) and unsupervised Machine Learning (Isolation Forest)
        anomaly scans across all committed business transactions.
        """
        transactions = db.query(BusinessTransaction).all()
        if not transactions:
            logger.info("No transaction records available in PostgreSQL for anomaly detection.")
            return []

        if len(transactions) < 4:
            logger.info("Sample size too small (< 4 records) for statistically significant anomaly detection.")
            return []

        # Convert to DataFrame for vectorized analysis
        data = []
        for t in transactions:
            data.append({
                "id": t.id,
                "transaction_id": t.transaction_id,
                "transaction_date": t.transaction_date,
                "product_id": t.product_id,
                "product_name": t.product_name or t.product_id,
                "category": t.category or "General",
                "quantity": float(t.quantity or 0),
                "unit_price": float(t.unit_price or 0.0),
                "total_amount": float(t.total_amount or 0.0),
                "business_unit": getattr(t, "business_unit", "Fuji Kyuko Co., Ltd.")
            })
        df = pd.DataFrame(data)

        detected: List[Dict[str, Any]] = []
        seen_keys = set()

        # -------------------------------------------------------------
        # 1. CATEGORY-AWARE STATISTICAL Z-SCORE & IQR DETECTION
        # -------------------------------------------------------------
        for category, cat_df in df.groupby("category"):
            amounts = cat_df["total_amount"].values
            cat_mean = float(np.mean(amounts))
            cat_std = float(np.std(amounts))

            q25, q75 = np.percentile(amounts, [25, 75])
            iqr = q75 - q25
            iqr_upper = q75 + (1.5 * iqr) if iqr > 0 else cat_mean + (2.0 * cat_std)

            for _, row in cat_df.iterrows():
                val = row["total_amount"]
                z_score = abs(val - cat_mean) / cat_std if cat_std > 0 else 0.0

                if (cat_std > 0 and z_score >= z_threshold) or (iqr > 0 and val > iqr_upper and z_score >= 2.0):
                    key = (row["transaction_id"], "Z-Score / IQR Outlier")
                    if key not in seen_keys:
                        seen_keys.add(key)
                        detected.append({
                            "record_id": row["transaction_id"],
                            "record_type": "transaction",
                            "detection_method": f"Statistical Z-Score ({z_score:.2f}σ) & IQR",
                            "observed_value": round(val, 2),
                            "reference_baseline": round(cat_mean, 2),
                            "reason": (
                                f"Transaction amount ¥{val:,.2f} deviates significantly from {category} baseline "
                                f"(Mean: ¥{cat_mean:,.2f}, StdDev: ¥{cat_std:,.2f}, Z-Score: {z_score:.2f})."
                            ),
                            "raw_record": {
                                "transaction_id": row["transaction_id"],
                                "product_name": row["product_name"],
                                "category": category,
                                "quantity": row["quantity"],
                                "unit_price": row["unit_price"],
                                "z_score": round(z_score, 2),
                                "category_mean": round(cat_mean, 2)
                            }
                        })

        # -------------------------------------------------------------
        # 2. UNSUPERVISED MACHINE LEARNING: ISOLATION FOREST
        # -------------------------------------------------------------
        if len(df) >= 8:
            features = df[["quantity", "unit_price", "total_amount"]].values
            # Standardize or train Isolation Forest directly on numerical features
            iso_forest = IsolationForest(
                n_estimators=100,
                contamination=contamination if contamination != "auto" else 0.08,
                random_state=42
            )
            iso_forest.fit(features)
            preds = iso_forest.predict(features) # -1 is outlier, 1 is inlier
            scores = iso_forest.score_samples(features)

            for idx, pred in enumerate(preds):
                if pred == -1:
                    row = df.iloc[idx]
                    key = (row["transaction_id"], "Isolation Forest")
                    if key not in seen_keys:
                        seen_keys.add(key)
                        anomaly_score = float(scores[idx])
                        detected.append({
                            "record_id": row["transaction_id"],
                            "record_type": "transaction",
                            "detection_method": "Scikit-Learn Isolation Forest (Unsupervised ML)",
                            "observed_value": round(float(row["total_amount"]), 2),
                            "reference_baseline": round(float(df["total_amount"].median()), 2),
                            "reason": (
                                f"High multi-dimensional feature space divergence. "
                                f"Quantity={row['quantity']}, UnitPrice=¥{row['unit_price']:,.2f}, Amount=¥{row['total_amount']:,.2f}. "
                                f"Isolation Forest Outlier Score: {anomaly_score:.3f}."
                            ),
                            "raw_record": {
                                "transaction_id": row["transaction_id"],
                                "product_name": row["product_name"],
                                "category": row["category"],
                                "features": [row["quantity"], row["unit_price"], row["total_amount"]],
                                "outlier_score": round(anomaly_score, 3)
                            }
                        })

        # -------------------------------------------------------------
        # 3. UNIT PRICE DIVERGENCE AUDIT (Cashier/Data Entry Glitches)
        # -------------------------------------------------------------
        for prod_id, prod_df in df.groupby("product_id"):
            if len(prod_df) >= 3:
                median_price = float(prod_df["unit_price"].median())
                for _, row in prod_df.iterrows():
                    u_price = row["unit_price"]
                    if median_price > 0 and abs(u_price - median_price) / median_price > 0.40:
                        key = (row["transaction_id"], "Unit Price Divergence")
                        if key not in seen_keys:
                            seen_keys.add(key)
                            detected.append({
                                "record_id": row["transaction_id"],
                                "record_type": "transaction",
                                "detection_method": "Pricing Baseline Deviation (>40%)",
                                "observed_value": round(u_price, 2),
                                "reference_baseline": round(median_price, 2),
                                "reason": (
                                    f"Unit price ¥{u_price:,.2f} differs by {((u_price - median_price)/median_price)*100:+.1f}% "
                                    f"from standard median catalog price of ¥{median_price:,.2f} for '{row['product_name']}'."
                                ),
                                "raw_record": {
                                    "transaction_id": row["transaction_id"],
                                    "product_name": row["product_name"],
                                    "unit_price": u_price,
                                    "catalog_median": median_price
                                }
                            })

        return detected

    @staticmethod
    def detect_inventory_anomalies(db: Session) -> List[Dict[str, Any]]:
        """
        Runs operational inventory anomaly checks against actual records in PostgreSQL.
        """
        inventory_records = db.query(InventoryRecord).all()
        if not inventory_records:
            return []

        detected: List[Dict[str, Any]] = []

        for item in inventory_records:
            sku = item.product_id
            name = item.product_name
            on_hand = float(item.available_quantity or 0)
            reorder = float(item.reorder_level or 0)
            safety = reorder * 0.5
            unit_cost = float(item.unit_cost or 0.0)

            # 1. Complete Stockout Anomaly
            if on_hand <= 0:
                detected.append({
                    "record_id": sku,
                    "record_type": "inventory",
                    "detection_method": "Critical Stockout Event",
                    "observed_value": on_hand,
                    "reference_baseline": reorder,
                    "reason": f"Inventory SKU '{sku}' ({name}) is completely exhausted (0 units). Reorder threshold is {reorder:.0f}.",
                    "raw_record": {
                        "sku": sku,
                        "item_name": name,
                        "location": item.warehouse,
                        "quantity_on_hand": on_hand,
                        "reorder_level": reorder
                    }
                })

            # 2. Severe Safety Stock Breach (< 50% of reorder level)
            elif reorder > 0 and on_hand < (reorder * 0.3):
                detected.append({
                    "record_id": sku,
                    "record_type": "inventory",
                    "detection_method": "Severe Stock Depletion (<30% Reorder Threshold)",
                    "observed_value": on_hand,
                    "reference_baseline": reorder,
                    "reason": (
                        f"SKU '{sku}' ({name}) has only {on_hand:.0f} units remaining, "
                        f"operating at {round((on_hand/reorder)*100, 1)}% of reorder threshold ({reorder:.0f} units)."
                    ),
                    "raw_record": {
                        "sku": sku,
                        "item_name": name,
                        "location": item.warehouse,
                        "quantity_on_hand": on_hand,
                        "reorder_level": reorder
                    }
                })

        return detected

    @classmethod
    def run_full_scan(cls, db: Session) -> Dict[str, Any]:
        """
        Executes end-to-end anomaly scan on transactions and inventory.
        Stores findings in PostgreSQL `anomaly_detections` with idempotency.
        """
        t0 = datetime.now(timezone.utc)
        tx_anomalies = cls.detect_transaction_anomalies(db)
        inv_anomalies = cls.detect_inventory_anomalies(db)
        all_candidates = tx_anomalies + inv_anomalies

        new_count = 0
        existing_records = db.query(AnomalyDetection).all()
        # Lookup existing by (record_id, detection_method)
        existing_map = {(a.record_id, a.detection_method): a for a in existing_records}

        for item in all_candidates:
            key = (item["record_id"], item["detection_method"])
            if key in existing_map:
                # Update baseline or observed value if changed, preserve review status
                existing = existing_map[key]
                existing.observed_value = item["observed_value"]
                existing.reference_baseline = item["reference_baseline"]
                existing.reason = item["reason"]
                existing.raw_record = item["raw_record"]
            else:
                anom = AnomalyDetection(
                    record_id=item["record_id"],
                    record_type=item["record_type"],
                    detection_method=item["detection_method"],
                    observed_value=item["observed_value"],
                    reference_baseline=item["reference_baseline"],
                    reason=item["reason"],
                    raw_record=item["raw_record"],
                    status="unreviewed"
                )
                db.add(anom)
                new_count += 1

        db.commit()

        # Audit log entry
        audit = AuditLog(
            user_email="system@fujikyuko.co.jp",
            action="RUN_ANOMALY_SCAN",
            entity_type="anomaly_detection",
            details={
                "candidates_found": len(all_candidates),
                "new_anomalies_registered": new_count,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        )
        db.add(audit)
        db.commit()

        duration_sec = round((datetime.now(timezone.utc) - t0).total_seconds(), 2)
        total_active = db.query(AnomalyDetection).count()
        unreviewed = db.query(AnomalyDetection).filter(AnomalyDetection.status == "unreviewed").count()

        return {
            "status": "success",
            "duration_seconds": duration_sec,
            "total_analyzed": len(all_candidates),
            "new_anomalies": new_count,
            "total_anomalies": total_active,
            "unreviewed_anomalies": unreviewed,
            "scan_timestamp": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def review_anomaly(
        db: Session,
        anomaly_id: int,
        status: str,
        reviewer_email: str,
        notes: Optional[str] = None
    ) -> AnomalyDetection:
        """
        Updates review status of an anomaly in the human-in-the-loop audit workflow.
        """
        valid_statuses = ["reviewed", "dismissed", "escalated", "unreviewed"]
        if status.lower() not in valid_statuses:
            raise ValueError(f"Invalid status '{status}'. Must be one of: {valid_statuses}")

        anomaly = db.query(AnomalyDetection).filter(AnomalyDetection.id == anomaly_id).first()
        if not anomaly:
            raise ValueError(f"Anomaly ID {anomaly_id} not found.")

        anomaly.status = status.lower()
        anomaly.reviewed_by = reviewer_email
        anomaly.reviewed_at = datetime.now(timezone.utc)
        if notes:
            raw = anomaly.raw_record or {}
            raw["review_notes"] = notes
            anomaly.raw_record = raw

        db.commit()
        db.refresh(anomaly)

        # Audit log
        audit = AuditLog(
            user_email=reviewer_email,
            action="REVIEW_ANOMALY",
            entity_type="anomaly_detection",
            entity_id=str(anomaly_id),
            details={
                "status": status,
                "record_id": anomaly.record_id,
                "notes": notes
            }
        )
        db.add(audit)
        db.commit()

        return anomaly
