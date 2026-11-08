import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models import Workflow
from app.automation.engine import run_workflow_pipeline

logger = logging.getLogger("fuji_flow.scheduler")

scheduler = BackgroundScheduler()

def scheduled_workflow_job(workflow_id: int):
    logger.info(f"Triggering scheduled execution for Workflow #{workflow_id}...")
    db: Session = SessionLocal()
    try:
        res = run_workflow_pipeline(
            workflow_id=workflow_id,
            trigger_type="scheduled",
            db=db
        )
        logger.info(f"Scheduled execution {res['execution_id']} finished with status: {res['status']}.")
    except Exception as e:
        logger.error(f"Error running scheduled workflow #{workflow_id}: {e}")
    finally:
        db.close()

def sync_workflow_jobs():
    """
    Syncs scheduled jobs in APScheduler from active Workflows in PostgreSQL.
    """
    db: Session = SessionLocal()
    try:
        active_workflows = db.query(Workflow).filter(
            Workflow.is_active == True,
            Workflow.schedule_cron.isnot(None)
        ).all()

        # Remove existing scheduled jobs
        scheduler.remove_all_jobs()

        for wf in active_workflows:
            try:
                # Expect standard 5-part cron or shorthand
                cron_parts = wf.schedule_cron.strip().split()
                if len(cron_parts) == 5:
                    minute, hour, day, month, day_of_week = cron_parts
                    trigger = CronTrigger(
                        minute=minute,
                        hour=hour,
                        day=day,
                        month=month,
                        day_of_week=day_of_week
                    )
                    scheduler.add_job(
                        scheduled_workflow_job,
                        trigger=trigger,
                        args=[wf.id],
                        id=f"wf_job_{wf.id}",
                        name=wf.name,
                        replace_existing=True
                    )
                    logger.info(f"Registered cron schedule '{wf.schedule_cron}' for workflow '{wf.name}'.")
            except Exception as e:
                logger.warning(f"Could not parse cron '{wf.schedule_cron}' for workflow {wf.id}: {e}")
    finally:
        db.close()

def start_scheduler():
    if not scheduler.running:
        scheduler.start()
        logger.info("Fuji Flow Background Scheduler started.")
        sync_workflow_jobs()

def shutdown_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Fuji Flow Background Scheduler stopped.")
