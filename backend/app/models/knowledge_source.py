import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class KnowledgeSource(Base):
    __tablename__ = "knowledge_sources"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(300), nullable=False, unique=True)
    abbreviation: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str | None] = mapped_column(String(1000))
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # "university_extension", "government", "research_journal", "horticultural_society", "internal"
    credibility_tier: Mapped[int] = mapped_column(Integer, default=1)
    # 1 = peer-reviewed / government, 2 = extension / society, 3 = curated web
    description: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
