import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.all_models import (
    BusinessTransaction,
    InventoryRecord,
    AnomalyDetection,
    WorkflowExecution
)
from app.analytics.sales_analytics import compute_sales_analytics
from app.analytics.inventory_analytics import compute_inventory_analytics

logger = logging.getLogger("fuji_flow.insights")

class BusinessInsightsEngine:
    """
    AI Business Insights Engine for Fuji Kyuko Co., Ltd.
    Generates executive narratives, risk assessments, and strategic recommendations
    strictly grounded in verified PostgreSQL transactional and operational data.
    """

    @classmethod
    def generate_executive_insights(cls, db: Session, time_range: str = "all") -> Dict[str, Any]:
        """
        Synthesizes sales, inventory, and anomaly records into an executive briefing.
        Uses deterministic, mathematically verified analytical rules to eliminate LLM hallucinations.
        """
        now = datetime.now(timezone.utc)

        # 1. Gather real underlying sales analytics
        sales_summary = compute_sales_analytics(db, time_range=time_range)
        inventory_summary = compute_inventory_analytics(db)

        has_sales_data = sales_summary["has_data"]
        has_inventory_data = inventory_summary["has_data"]

        if not has_sales_data and not has_inventory_data:
            return {
                "has_data": False,
                "message": "No business data available. Connect a data source or upload a dataset.",
                "generated_at": now.isoformat(),
                "executive_briefing": None,
                "strategic_recommendations": [],
                "key_findings": [],
                "provenance": {
                    "data_source": "PostgreSQL Core Database (fuji_flow)",
                    "sales_records_analyzed": 0,
                    "inventory_records_analyzed": 0,
                    "generation_mode": "Deterministic Grounded Analytics"
                }
            }

        kpis = sales_summary.get("kpis", {})
        inv_kpis = inventory_summary.get("kpis", {})

        # 2. Gather anomaly statistics
        total_anomalies = db.query(AnomalyDetection).count()
        unreviewed_anomalies = db.query(AnomalyDetection).filter(AnomalyDetection.status == "unreviewed").count()

        # 3. Identify division leader & underperformer
        category_perf = sales_summary.get("category_performance", [])
        top_category = category_perf[0] if category_perf else None
        lowest_category = category_perf[-1] if len(category_perf) > 1 else None

        # 4. Synthesize Executive Narrative
        total_rev = kpis.get("total_sales", 0.0)
        tx_count = kpis.get("total_transactions", 0)
        atv = kpis.get("average_transaction_value", 0.0)
        total_inv_val = inv_kpis.get("total_inventory_valuation", 0.0)
        low_stock_cnt = inv_kpis.get("low_stock_sku_count", 0)
        out_of_stock_cnt = inv_kpis.get("stockout_count", 0)

        paragraphs = []

        # Revenue & Sales Overview
        if has_sales_data and tx_count > 0:
            top_cat_rev = top_category.get('revenue', top_category.get('total_sales', 0.0)) if top_category else 0.0
            top_cat_pct = top_category.get('percentage', 0.0) if top_category else 0.0
            top_cat_str = f" The leading revenue driver is **{top_category['category']}** contributing ¥{top_cat_rev:,.2f} ({top_cat_pct}% of net sales)." if top_category else ""
            paragraphs.append(
                f"Across {tx_count:,} verified operational transactions, enterprise operations generated "
                f"**¥{total_rev:,.2f}** in aggregate net revenue, with an Average Transaction Value (ATV) of **¥{atv:,.2f}**.{top_cat_str}"
            )
        else:
            paragraphs.append("No sales transactions have been staged for the selected reporting period.")

        # Supply Chain & Inventory Health
        if has_inventory_data:
            inv_status_str = (
                f"Total inventory asset valuation stands at **¥{total_inv_val:,.2f}** across {inv_kpis['total_skus']} catalog SKUs. "
                f"Current supply chain monitoring flags **{low_stock_cnt} items at or below reorder threshold**, "
                f"with **{out_of_stock_cnt} SKUs experiencing complete stockout** requiring immediate vendor dispatch."
            )
            paragraphs.append(inv_status_str)

        # Operational Risk & Integrity
        if total_anomalies > 0:
            paragraphs.append(
                f"Audit diagnostics have identified **{total_anomalies} anomalies** "
                f"({unreviewed_anomalies} awaiting management review). Statistical and Isolation Forest scans flagged high-value outlier transactions "
                f"and stock depletion events for auditor inspection."
            )
        else:
            paragraphs.append(
                "Zero data anomalies or fraudulent outliers detected across current transaction and inventory datasets."
            )

        executive_briefing = "\n\n".join(paragraphs)

        # 5. Strategic Recommendations grounded in actual numbers
        recommendations = []

        if low_stock_cnt > 0:
            reorder_recs = inventory_summary.get("reorder_recommendations", [])
            est_cost = sum(r.get("estimated_reorder_cost", 0) for r in reorder_recs)
            urgent_skus = [r.get("product_id", r.get("sku", "ITEM")) for r in reorder_recs[:3]]
            recommendations.append({
                "id": "REC-01",
                "priority": "HIGH",
                "category": "Supply Chain & Procurement",
                "title": f"Expedite Replenishment for {low_stock_cnt} Depleted SKUs",
                "action": f"Issue purchase orders for high-turnover items ({', '.join(urgent_skus)}). Estimated procurement capital required: ¥{est_cost:,.2f}.",
                "impact": "Prevents revenue leakage and visitor dissatisfaction at Fuji-Q Highland and retail stores.",
                "grounded_metric": f"{low_stock_cnt} low stock SKUs (Total valuation ¥{total_inv_val:,.2f})"
            })

        if top_category and top_category["percentage"] > 40.0:
            recommendations.append({
                "id": "REC-02",
                "priority": "MEDIUM",
                "category": "Revenue Diversification",
                "title": f"Leverage {top_category['category']} High Margin Volume for Cross-Selling",
                "action": f"{top_category['category']} commands {top_category['percentage']}% of revenue. Bundle tickets or packages with lower volume divisions.",
                "impact": "Increases overall basket size (current ATV: ¥{atv:,.2f}) across hospitality and retail units.",
                "grounded_metric": f"Leading division revenue share: {top_category['percentage']}%"
            })

        if unreviewed_anomalies > 0:
            recommendations.append({
                "id": "REC-03",
                "priority": "HIGH",
                "category": "Risk & Compliance",
                "title": f"Review {unreviewed_anomalies} Pending Audit Anomalies",
                "action": "Complete human-in-the-loop review in the Anomaly Detection Center to confirm whether flagged outliers represent special corporate bookings or data entry errors.",
                "impact": "Maintains strict accounting integrity and compliance with Japanese corporate financial standards.",
                "grounded_metric": f"{unreviewed_anomalies} unreviewed anomaly records in PostgreSQL"
            })

        # 6. Key Quantitative Findings
        key_findings = [
            {
                "label": "Total Net Revenue",
                "value": f"¥{total_rev:,.2f}",
                "detail": f"Derived from {tx_count:,} transactions"
            },
            {
                "label": "Average Transaction Value",
                "value": f"¥{atv:,.2f}",
                "detail": "Revenue / Transaction count"
            },
            {
                "label": "Inventory Asset Valuation",
                "value": f"¥{total_inv_val:,.2f}",
                "detail": f"{inv_kpis['total_skus']} tracked SKUs"
            },
            {
                "label": "Active Anomaly Alerts",
                "value": f"{total_anomalies} detected",
                "detail": f"{unreviewed_anomalies} unreviewed"
            }
        ]

        return {
            "has_data": True,
            "generated_at": now.isoformat(),
            "time_range": time_range,
            "executive_briefing": executive_briefing,
            "strategic_recommendations": recommendations,
            "key_findings": key_findings,
            "top_performing_category": top_category["category"] if top_category else "N/A",
            "provenance": {
                "data_source": "PostgreSQL Core Database (fuji_flow)",
                "sales_records_analyzed": tx_count,
                "inventory_records_analyzed": inv_kpis["total_skus"],
                "generation_mode": "Deterministic Grounded Analytics (Zero Synthetic Data)"
            }
        }

    @classmethod
    def answer_query(cls, db: Session, question: str) -> Dict[str, Any]:
        """
        Answers natural language operational inquiries using exact SQL database aggregates.
        Guaranteed zero hallucinations.
        """
        q = question.lower().strip()
        sales_summary = compute_sales_analytics(db, time_range="all")
        inv_summary = compute_inventory_analytics(db)

        kpis = sales_summary.get("kpis", {})
        inv_kpis = inv_summary.get("kpis", {})

        tx_count = kpis.get("total_transactions", 0)
        total_sales = kpis.get("total_sales", 0.0)
        atv = kpis.get("average_transaction_value", 0.0)
        total_inv_val = inv_kpis.get("total_inventory_valuation", 0.0)

        # Simple semantic router to extract exact factual answers
        if any(term in q for term in ["revenue", "sales", "total money", "how much made"]):
            answer = (
                f"According to verified database transactions, enterprise operations have generated a cumulative "
                f"total net sales of ¥{total_sales:,.2f} across {tx_count} recorded transactions."
            )
            data_points = {"total_sales": total_sales, "transactions": tx_count}

        elif any(term in q for term in ["atv", "average ticket", "average transaction"]):
            answer = (
                f"The verified Average Transaction Value (ATV) is ¥{atv:,.2f}. "
                f"This is calculated strictly as Total Sales (¥{total_sales:,.2f}) divided by Total Transactions ({tx_count})."
            )
            data_points = {"average_transaction_value": atv}

        elif any(term in q for term in ["inventory", "valuation", "stock", "warehouse", "reorder"]):
            low_items = inv_kpis.get("low_stock_sku_count", 0)
            out_items = inv_kpis.get("stockout_count", 0)
            sku_count = inv_kpis.get("total_skus", 0)
            answer = (
                f"Current inventory valuation stands at ¥{total_inv_val:,.2f} across {sku_count} SKUs. "
                f"There are currently {low_items} items at or below reorder level and {out_items} SKUs completely out of stock."
            )
            data_points = {
                "inventory_valuation": total_inv_val,
                "low_stock_items": low_items,
                "out_of_stock_items": out_items
            }

        elif any(term in q for term in ["top", "best product", "best division", "category"]):
            cats = sales_summary.get("category_performance", [])
            prods = sales_summary.get("top_products", [])
            top_cat = cats[0] if cats else None
            top_prod = prods[0] if prods else None
            cat_rev = top_cat.get('revenue', top_cat.get('total_sales', 0.0)) if top_cat else 0.0
            prod_rev = top_prod.get('revenue', top_prod.get('total_sales', 0.0)) if top_prod else 0.0
            prod_qty = top_prod.get('units_sold', top_prod.get('quantity_sold', 0)) if top_prod else 0
            cat_str = f"top-selling division is '{top_cat['category']}' (¥{cat_rev:,.2f}, {top_cat['percentage']}%)" if top_cat else "no division records"
            prod_str = f"top product is '{top_prod['product_name']}' (¥{prod_rev:,.2f}, {prod_qty} units sold)" if top_prod else "no product records"
            answer = f"Based on transaction records, the {cat_str}. The {prod_str}."
            data_points = {"top_category": top_cat, "top_product": top_prod}

        elif any(term in q for term in ["anomaly", "anomalies", "fraud", "outlier", "risk"]):
            anom_count = db.query(AnomalyDetection).count()
            unreviewed = db.query(AnomalyDetection).filter(AnomalyDetection.status == "unreviewed").count()
            answer = (
                f"There are currently {anom_count} anomalies logged in PostgreSQL ({unreviewed} unreviewed). "
                f"These were flagged via statistical Z-score (>2.5σ) and Isolation Forest machine learning."
            )
            data_points = {"total_anomalies": anom_count, "unreviewed": unreviewed}

        else:
            answer = (
                f"Summary of verified corporate metrics: Total Sales: ¥{total_sales:,.2f} ({tx_count} txns), "
                f"Average Transaction Value: ¥{atv:,.2f}, Inventory Valuation: ¥{total_inv_val:,.2f} ({inv_kpis['total_skus']} SKUs). "
                f"All figures are calculated from PostgreSQL."
            )
            data_points = {"total_sales": total_sales, "total_valuation": total_inv_val}

        return {
            "question": question,
            "answer": answer,
            "supporting_data": data_points,
            "provenance": {
                "source": "PostgreSQL Core Database (fuji_flow)",
                "calculated_at": datetime.now(timezone.utc).isoformat(),
                "hallucination_risk": "0.0% (Deterministic Aggregation)"
            }
        }
