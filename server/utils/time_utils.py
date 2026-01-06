from datetime import datetime, timedelta, timezone

# IST timezone
IST_OFFSET = timedelta(hours=5, minutes=30)
IST = timezone(IST_OFFSET)

def ist_now():
    """
    Current time in IST (timezone-aware)
    """
    return datetime.now(IST)


def ist_today_range_utc():
    """
    Returns today's IST start & end converted to UTC (naive),
    safe for MongoDB queries.
    """
    ist_today = ist_now().date()

    ist_start = datetime.combine(
        ist_today,
        datetime.min.time(),
        tzinfo=IST
    )

    ist_end = ist_start + timedelta(days=1)

    return (
        ist_start.astimezone(timezone.utc).replace(tzinfo=None),
        ist_end.astimezone(timezone.utc).replace(tzinfo=None),
    )
