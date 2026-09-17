from datetime import date, datetime
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, Float, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SiteMeasurement(Base):
    __tablename__ = "site_measurements"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    site_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("sites.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    measurement_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    carbon_stock: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    carbon_sequestered: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    biodiversity_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    tree_cover: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    site: Mapped["Site"] = relationship(
        "Site",
        back_populates="measurements",
    )