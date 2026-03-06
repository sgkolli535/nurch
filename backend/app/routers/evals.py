"""
Eval metrics and batch evaluation endpoints.
Used for monitoring AI quality and regression testing after prompt changes.
"""
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.evals import evaluate_diagnosis, evaluate_recommendations, evaluate_safety
from app.models.diagnosis import Diagnosis
from app.models.eval_result import EvalResult
from app.models.garden import Garden
from app.models.plant import Plant
from app.models.species import Species
from app.models.user import User

router = APIRouter(prefix="/api/v1/evals", tags=["evals"])


@router.get("/metrics")
async def get_eval_metrics(
    eval_type: str | None = Query(None),
    days: int = Query(30, le=365),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get eval metrics aggregated over the specified time window."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    query = select(
        EvalResult.eval_type,
        func.count().label("total"),
        func.sum(EvalResult.passed.cast(int)).label("passed_count"),
        func.avg(EvalResult.score).label("avg_score"),
    ).where(EvalResult.created_at >= since).group_by(EvalResult.eval_type)

    if eval_type:
        query = query.where(EvalResult.eval_type == eval_type)

    result = await db.execute(query)
    rows = result.all()

    metrics = []
    for row in rows:
        total = row.total or 0
        passed = row.passed_count or 0
        metrics.append({
            "eval_type": row.eval_type,
            "total_evaluations": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": round(passed / total, 3) if total > 0 else None,
            "avg_score": round(float(row.avg_score), 3) if row.avg_score else None,
            "period_days": days,
        })

    return {"metrics": metrics, "since": since.isoformat()}


@router.post("/run-batch")
async def run_batch_eval(
    limit: int = Query(50, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Re-evaluate the last N diagnoses. Used for regression testing after prompt changes.
    Only evaluates diagnoses belonging to the current user's plants.
    """
    # Get recent diagnoses for user's plants
    diagnoses_result = await db.execute(
        select(Diagnosis)
        .join(Plant, Diagnosis.plant_id == Plant.id)
        .join(Garden, Plant.garden_id == Garden.id)
        .where(Garden.user_id == user.id)
        .order_by(Diagnosis.created_at.desc())
        .limit(limit)
    )
    diagnoses = diagnoses_result.scalars().all()

    results = {"evaluated": 0, "diagnosis_accuracy": {"passed": 0, "failed": 0}, "safety": {"passed": 0, "failed": 0}}

    for diagnosis in diagnoses:
        # Load species
        species = None
        plant_result = await db.execute(select(Plant).where(Plant.id == diagnosis.plant_id))
        plant = plant_result.scalar_one_or_none()
        if plant and plant.species_id:
            species_result = await db.execute(select(Species).where(Species.id == plant.species_id))
            species = species_result.scalar_one_or_none()

        # Run evals
        diag_eval = await evaluate_diagnosis(diagnosis, species)
        safety_eval = await evaluate_safety(diagnosis)

        db.add(diag_eval)
        db.add(safety_eval)

        results["evaluated"] += 1
        if diag_eval.passed:
            results["diagnosis_accuracy"]["passed"] += 1
        else:
            results["diagnosis_accuracy"]["failed"] += 1
        if safety_eval.passed:
            results["safety"]["passed"] += 1
        else:
            results["safety"]["failed"] += 1

    await db.commit()
    return results


@router.get("/failures")
async def get_recent_failures(
    limit: int = Query(20, le=100),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get recent eval failures for debugging."""
    result = await db.execute(
        select(EvalResult)
        .where(EvalResult.passed == False)
        .order_by(EvalResult.created_at.desc())
        .limit(limit)
    )
    failures = result.scalars().all()
    return [
        {
            "id": str(f.id),
            "diagnosis_id": str(f.diagnosis_id) if f.diagnosis_id else None,
            "eval_type": f.eval_type,
            "score": float(f.score) if f.score else None,
            "details": f.details,
            "model_used": f.model_used,
            "prompt_version": f.prompt_version_used,
            "created_at": f.created_at.isoformat(),
        }
        for f in failures
    ]
