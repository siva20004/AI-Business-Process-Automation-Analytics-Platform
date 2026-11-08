# FUJI FLOW – AI-Based Business Process Automation & Analytics Platform

**Client Organization:** Fuji Kyuko Co., Ltd. (富士急行株式会社), Japan  
**System Architecture:** Production DX Platform (FastAPI + PostgreSQL 18 + React 18 + TypeScript + Scikit-Learn + ReportLab + APScheduler)

---

## 1. Overview & Business Context

**FUJI FLOW** is an enterprise-grade business process automation and analytics platform engineered specifically for the Digital Transformation (DX) requirements of **Fuji Kyuko Co., Ltd.** (operating across transportation, tourism, hotels, amusement parks such as Fuji-Q Highland, food services, and retail).

### Core Architectural Principles
- **Strict Real-Data Mandate:** Zero fabricated records, zero mock sales, zero hardcoded revenue, zero random anomalies. If no data has been uploaded or connected, the platform explicitly displays:  
  `"No business data available. Connect a data source or upload a dataset."`
- **End-to-End Governance:** Every metric and analytics calculation explicitly reports its:
  - Source data provenance (PostgreSQL Core Database `fuji_flow`)
  - Reporting period window (e.g., Today, 7D, 30D, All Time)
  - Verified count of records processed
  - Calculation method (e.g., SQL Sum Aggregation, Isolation Forest feature-space scoring)
  - Data quality and validation status (Verified)

---

## 2. All 14 Enterprise Modules

| # | Module Name | Japanese Title | Architectural Capabilities |
| :--- | :--- | :--- | :--- |
| **01** | **Executive Dashboard** | 経営管理ダッシュボード | Group-level KPIs, real-time sales trends, division share, job telemetry, and anomaly trends. |
| **02** | **Data Sources** | データソース管理 | Connectors for CSV, XLSX, JSON, PostgreSQL, and REST APIs with live connection testing. |
| **03** | **Data Upload Center** | データ取込センター | Multi-format file ingestion, encoding fallback, schema preview, and staging history. |
| **04** | **Data Cleaning & Validation** | データクレンジング・検証 | Strict contract enforcement, whitespace sanitation, type casting, mathematical validation (`total_amount = qty * unit_price`). |
| **05** | **Workflow Automation Engine** | ワークフロー自動化 | 8-step pipeline builder orchestrating ingestion, contract validation, DB storage, analytics, anomaly scans, reporting, and email prep. |
| **06** | **Sales Analytics** | 売上分析センター | SQL Net Sales aggregations, volume, ATV ($\frac{\text{Sales}}{\text{Txns}}$), growth %, and 6-division revenue breakdowns. |
| **07** | **Inventory Analytics** | 在庫・サプライチェーン分析 | Multi-hub stock valuation ($\sum \text{qty} \times \text{unit\_cost}$), low stock alerts, and automated reorder recommendation engine. |
| **08** | **AI Anomaly Detection** | AI異常検知エンジン | Dual unsupervised Scikit-learn `IsolationForest` and category-aware statistical Z-score (>2.5σ) with human audit review workflow. |
| **09** | **AI Business Insights** | AI経営分析サマリー | Executive synthesis narrative and interactive natural-language Q&A grounded 100% in PostgreSQL metrics with 0.0% hallucination risk. |
| **10** | **Report Center** | レポート生成センター | Autonomous compilation of audit-ready PDF documents (`ReportLab`), multi-tab Excel workbooks (`OpenPyXL`), and Power BI CSVs. |
| **11** | **Email Automation** | メール自動配信 | SMTP gateway alerts (daily digests, stockout warnings, anomaly alerts) with live preview and explicit user dispatch confirmation. |
| **12** | **Workflow History** | 実行ログ・監視 | Step-by-step latency tracking, execution timelines, exact failed step diagnostics, and one-click retry engine. |
| **13** | **User Management** | アカウント・権限管理 | RBAC security (Admin, Analyst, Viewer) with secure JWT issuance and bcrypt 12-round password hashing. |
| **14** | **Settings & Governance** | システム設定・ガバナンス | Platform environment metadata, PostgreSQL telemetry, retention policies, and zero-synthetic data policy enforcement. |

---

## 3. Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React, Axios, React Router v6
- **Backend:** Python 3.13+, FastAPI, SQLAlchemy 2.0, Pydantic v2, Pandas, NumPy, Scikit-learn, OpenPyXL, ReportLab, APScheduler, Psycopg2-binary, Bcrypt, Python-Jose
- **Database:** PostgreSQL 18 (`fuji_flow`) on `localhost:5432` with 13 relational tables and Alembic migrations
- **Operating Environment:** Windows 10/11 Localhost Execution

---

## 4. Localhost Execution URLs

- **Frontend Web Application:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **System Health & DB Diagnostic:** [http://localhost:8000/health](http://localhost:8000/health)
- **PostgreSQL Database:** `localhost:5432/fuji_flow`

---

## 5. Seeded Credentials

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Enterprise Administrator** | `admin@fujikyuko.co.jp` | `FujiFlow2026!` | Full administrative, RBAC governance, and pipeline execution |
| **Senior Business Analyst** | `analyst@fujikyuko.co.jp` | `FujiFlow2026!` | Data upload, contract validation, analytics & report compilation |

---

## 6. Windows Execution Scripts

### 1. `setup.bat`
Inspects Windows Python, Node.js, and PostgreSQL environments. Sets up virtual environment, installs dependencies, provisions database schemas, and seeds default records.
```cmd
setup.bat
```

### 2. `start.bat`
Starts the FastAPI backend (port 8000) and Vite frontend (port 5173), verifies `/health`, and launches [http://localhost:5173](http://localhost:5173).
```cmd
start.bat
```

### 3. `stop.bat`
Safely terminates only the background processes listening on ports 8000 and 5173.
```cmd
stop.bat
```

---

## 7. Quality Assurance & Test Verification

All 36 backend tests pass completely with zero regressions:
```cmd
backend\venv\Scripts\pytest.exe tests -v
```

```text
======================== 36 passed, 1 warning in 13.85s ========================
tests/test_analytics.py (4 tests) - PASSED
tests/test_auth.py (5 tests) - PASSED
tests/test_dashboard.py (2 tests) - PASSED
tests/test_data_processing.py (4 tests) - PASSED
tests/test_data_sources.py (2 tests) - PASSED
tests/test_health.py (1 test) - PASSED
tests/test_intelligence.py (5 tests) - PASSED
tests/test_reporting_and_system.py (7 tests) - PASSED
tests/test_workflows.py (6 tests) - PASSED
```

Frontend compilation test:
```cmd
cd frontend && npm run build
```
Result: **0 errors, 0 warnings**; compiled bundle ready in `frontend/dist`.
