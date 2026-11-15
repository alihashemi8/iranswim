import datetime

def gregorian_to_jalali(gy, gm, gd):
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    if gy > 1600:
        jy = 979
        gy -= 1600
    else:
        jy = 0
        gy -= 621
    gy2 = gy if (gm > 2) else (gy - 1)
    days = (365 * gy) + ((gy2 + 4) // 4) - ((gy2 + 100) // 100) + ((gy2 + 400) // 400) - 80 + gd + g_d_m[gm - 1]
    jy += 33 * (days // 12053)
    days %= 12053
    jy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        jy += (days - 1) // 365
        days = (days - 1) % 365
    jm = (days // 31 + 1) if (days < 186) else ((days - 186) // 30 + 7)
    jd = 1 + (days % 31 if (days < 186) else (days - 186) % 30)
    return jy, jm, jd


def is_jalali_leap(jy):
    """
    Check if Jalali year jy is a leap year (کبیسه).
    A leap year in the Solar Hijri calendar has 30 days in Esfand instead of 29.
    """
    return (((jy + 38) * 31) % 128) <= 30


def jalali_to_gregorian(jy, jm, jd):
    jy += 1595
    days = -355668 + (365 * jy) + ((jy // 33) * 8) + (((jy % 33) + 3) // 4) + jd + ((jm - 1) * 31 if jm < 7 else ((jm - 7) * 30) + 186)
    gy = 400 * (days // 146097)
    days %= 146097
    if days > 36524:
        days -= 1
        gy += 100 * (days // 36524)
        days %= 36524
        if days >= 365:
            days += 1
    gy += 4 * (days // 1461)
    days %= 1461
    if days > 365:
        gy += (days - 1) // 365
        days = (days - 1) % 365
    gd = days + 1
    sal_a = [0, 31, 29 if (gy % 4 == 0 and gy % 100 != 0) or (gy % 400 == 0) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    gm = 0
    while gm < 13 and gd > sal_a[gm]:
        gd -= sal_a[gm]
        gm += 1
    return gy, gm, gd


def get_current_jalali_year(target_date=None):
    if target_date is None:
        target_date = datetime.date.today()
    elif isinstance(target_date, datetime.datetime):
        target_date = target_date.date()
    jy, _, _ = gregorian_to_jalali(target_date.year, target_date.month, target_date.day)
    return jy


def get_esfand_end_date(jy=None):
    """
    Returns the Gregorian date corresponding to the last day of Esfand
    (۲۹ یا ۳۰ اسفند) of the given Jalali year (or current year if omitted).
    """
    if jy is None:
        jy = get_current_jalali_year()
    esfand_days = 30 if is_jalali_leap(jy) else 29
    gy, gm, gd = jalali_to_gregorian(jy, 12, esfand_days)
    return datetime.date(gy, gm, gd)


def format_jalali_date(target_date):
    if not target_date:
        return ''
    if isinstance(target_date, datetime.datetime):
        target_date = target_date.date()
    jy, jm, jd = gregorian_to_jalali(target_date.year, target_date.month, target_date.day)
    return f"{jy}/{jm:02d}/{jd:02d}"
