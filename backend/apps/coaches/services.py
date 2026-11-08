import datetime
from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from .models import (
    CoachProfile, CoachContract, CoachPayroll, PayrollAdjustment,
    CoachPaymentRecord, CoachLeaveRequest, CoachPerformanceEvaluation,
    CoachAdministrativeNote, CoachActivityLog, CoachAttendanceCorrectionAudit
)
from apps.scheduling.models import ClassSession
from apps.education.models import SwimmerGroup


class CoachActivityLogger:
    @staticmethod
    def log(coach, event_type, actor, description, metadata=None):
        return CoachActivityLog.objects.create(
            coach=coach,
            event_type=event_type,
            actor=actor,
            description=description,
            metadata=metadata or {}
        )


class PayrollService:
    @staticmethod
    def calculate_monthly_payroll(
        coach,
        period_start,
        period_end,
        period_label=None,
        preview_only=False,
        created_by=None,
        base_rate_override=None,
        compensation_model_override=None
    ):
        """
        محاسبه حقوق ماهانه مربی بر اساس یکی از ۳ مدل مالی:
        ۱. ساعتی (Hourly): ساعات تدریس مصوب × نرخ ساعتی
        ۲. حقوق ثابت (Fixed Salary): مبلغ مقطوع ماهانه
        ۳. درصدی (Percentage): درآمد مشمول × درصد مصوب
        """
        if period_end < period_start:
            raise ValidationError('تاریخ پایان دوره نمی‌تواند قبل از تاریخ شروع باشد.')

        # 1. قرارداد استنادی فعال در این بازه را بیاب
        contract = coach.contracts.filter(
            status=CoachContract.Status.ACTIVE,
            start_date__lte=period_end,
            end_date__gte=period_start
        ).order_by('-start_date').first()

        # مدل همکاری و نرخ
        comp_model = compensation_model_override or (contract.employment_type if contract else coach.employment_type)

        if comp_model == CoachProfile.EmploymentType.HOURLY:
            if base_rate_override is not None:
                rate = Decimal(str(base_rate_override))
            elif contract and contract.hourly_rate > 0:
                rate = contract.hourly_rate
            else:
                rate = coach.hourly_rate
        elif comp_model == CoachProfile.EmploymentType.FIXED:
            if base_rate_override is not None:
                rate = Decimal(str(base_rate_override))
            elif contract and contract.fixed_salary > 0:
                rate = contract.fixed_salary
            else:
                rate = coach.fixed_monthly_salary
        elif comp_model == CoachProfile.EmploymentType.PERCENTAGE:
            if base_rate_override is not None:
                rate = Decimal(str(base_rate_override))
            elif contract and contract.percentage_rate > 0:
                rate = contract.percentage_rate
            else:
                rate = coach.revenue_percentage
        else:
            rate = Decimal('0.00')

        # 2. استخراج جلسات کلاسی برگزارشده (Verified & Completed sessions only)
        completed_sessions = ClassSession.objects.filter(
            coach=coach,
            session_date__gte=period_start,
            session_date__lte=period_end,
            status=ClassSession.Status.COMPLETED
        ).distinct()

        teaching_hours = Decimal('0.00')
        completed_count = 0
        for s in completed_sessions:
            completed_count += 1
            if s.start_time and s.end_time:
                t1 = datetime.datetime.combine(s.session_date, s.start_time)
                t2 = datetime.datetime.combine(s.session_date, s.end_time)
                secs = (t2 - t1).total_seconds()
                if secs > 0:
                    teaching_hours += Decimal(str(secs / 3600.0)).quantize(Decimal('0.01'))

        # 3. محاسبه درآمد مشمول برای مدل درصدی
        eligible_revenue = Decimal('0.00')
        percentage_basis = (contract.percentage_basis if contract else coach.percentage_revenue_basis) or 'COURSE_GROSS'
        if comp_model == CoachProfile.EmploymentType.PERCENTAGE:
            assigned_groups = SwimmerGroup.objects.filter(
                coach_assignments__coach=coach,
                course__start_date__lte=period_end,
                course__end_date__gte=period_start
            ).distinct()

            if percentage_basis == 'COURSE_GROSS':
                for grp in assigned_groups:
                    enrolled_swimmers = grp.enrollments.filter(status__in=['ACTIVE', 'COMPLETED']).count()
                    eligible_revenue += Decimal(str(grp.course.base_price)) * enrolled_swimmers
            elif percentage_basis == 'COURSE_COLLECTED':
                from apps.finance.models import PaymentAllocation, Payment
                allocs = PaymentAllocation.objects.filter(
                    invoice__enrollment__group__in=assigned_groups,
                    payment__status=Payment.Status.SUCCESSFUL,
                    payment__paid_at__date__gte=period_start,
                    payment__paid_at__date__lte=period_end
                )
                collected = allocs.aggregate(tot=models.Sum('allocated_amount'))['tot']
                eligible_revenue = collected or Decimal('0.00')
            else:
                # Custom or default gross
                for grp in assigned_groups:
                    enrolled_swimmers = grp.enrollments.filter(status__in=['ACTIVE', 'COMPLETED']).count()
                    eligible_revenue += Decimal(str(grp.course.base_price)) * enrolled_swimmers

        # 4. محاسبه دستمزد پایه
        if comp_model == CoachProfile.EmploymentType.HOURLY:
            base_compensation = (teaching_hours * rate).quantize(Decimal('0.01'))
        elif comp_model == CoachProfile.EmploymentType.FIXED:
            base_compensation = rate.quantize(Decimal('0.01'))
        elif comp_model == CoachProfile.EmploymentType.PERCENTAGE:
            base_compensation = (eligible_revenue * (rate / Decimal('100.00'))).quantize(Decimal('0.01'))
        else:
            base_compensation = Decimal('0.00')

        if not period_label:
            period_label = f"{period_start.strftime('%Y/%m/%d')} تا {period_end.strftime('%Y/%m/%d')}"

        # در صورت درخواست پیش‌نمایش (Preview)
        if preview_only:
            gross = base_compensation
            net = base_compensation
            return {
                'coach_id': coach.id,
                'coach_name': coach.full_name,
                'contract_id': contract.id if contract else None,
                'period_label': period_label,
                'period_start': period_start,
                'period_end': period_end,
                'compensation_model': comp_model,
                'base_rate': rate,
                'teaching_hours': teaching_hours,
                'completed_sessions_count': completed_count,
                'eligible_revenue': eligible_revenue,
                'base_compensation': base_compensation,
                'bonuses_amount': Decimal('0.00'),
                'overtime_amount': Decimal('0.00'),
                'deductions_amount': Decimal('0.00'),
                'gross_amount': gross,
                'net_payable_amount': net,
            }

        # ثبت قطعی در دیتابیس درون ترنزکشن
        with transaction.atomic():
            payroll, created = CoachPayroll.objects.select_for_update().get_or_create(
                coach=coach,
                period_start=period_start,
                period_end=period_end,
                defaults={
                    'contract': contract,
                    'period_label': period_label,
                    'compensation_model': comp_model,
                    'base_rate': rate,
                    'teaching_hours': teaching_hours,
                    'completed_sessions_count': completed_count,
                    'eligible_revenue': eligible_revenue,
                    'base_compensation': base_compensation,
                    'bonuses_amount': Decimal('0.00'),
                    'overtime_amount': Decimal('0.00'),
                    'deductions_amount': Decimal('0.00'),
                    'gross_amount': base_compensation,
                    'net_payable_amount': base_compensation,
                    'approval_status': CoachPayroll.ApprovalStatus.DRAFT,
                    'payment_status': CoachPayroll.PaymentStatus.UNPAID,
                }
            )

            if not created:
                if payroll.approval_status == CoachPayroll.ApprovalStatus.APPROVED:
                    raise ValidationError('این فیش حقوقی قبلاً تأیید شده است و امکان محاسبه مجدد ندارد.')
                # اگر پیش‌نویس بود، مقادیر بازسازی می‌شوند
                payroll.contract = contract
                payroll.period_label = period_label
                payroll.compensation_model = comp_model
                payroll.base_rate = rate
                payroll.teaching_hours = teaching_hours
                payroll.completed_sessions_count = completed_count
                payroll.eligible_revenue = eligible_revenue
                payroll.base_compensation = base_compensation

            # محاسبه مجموع تعدیلات (پاداش‌ها و کسورات ثبت‌شده)
            bonuses = payroll.adjustments.filter(
                adjustment_type__in=[PayrollAdjustment.AdjustmentType.BONUS, PayrollAdjustment.AdjustmentType.MANUAL]
            ).aggregate(tot=models.Sum('amount'))['tot'] or Decimal('0.00')

            overtime = payroll.adjustments.filter(
                adjustment_type=PayrollAdjustment.AdjustmentType.OVERTIME
            ).aggregate(tot=models.Sum('amount'))['tot'] or Decimal('0.00')

            deductions = payroll.adjustments.filter(
                adjustment_type__in=[
                    PayrollAdjustment.AdjustmentType.DEDUCTION,
                    PayrollAdjustment.AdjustmentType.TAX_INSURANCE,
                    PayrollAdjustment.AdjustmentType.PENALTY
                ]
            ).aggregate(tot=models.Sum('amount'))['tot'] or Decimal('0.00')

            payroll.bonuses_amount = bonuses
            payroll.overtime_amount = overtime
            payroll.deductions_amount = deductions
            payroll.gross_amount = payroll.base_compensation + payroll.bonuses_amount + payroll.overtime_amount
            payroll.net_payable_amount = max(Decimal('0.00'), payroll.gross_amount - payroll.deductions_amount)
            payroll.save()

            payroll.recalculate_payment_status()

            CoachActivityLogger.log(
                coach=coach,
                event_type=CoachActivityLog.EventType.PAYROLL_GENERATED,
                actor=created_by,
                description=f"صدور فیش حقوقی دوره {payroll.period_label} با مبلغ خالص {payroll.net_payable_amount:,} تومان",
                metadata={'payroll_id': payroll.id, 'net_payable': str(payroll.net_payable_amount)}
            )

            return payroll

    @staticmethod
    def approve_payroll(payroll, approved_by):
        """تأیید نهایی فیش حقوقی توسط مدیر"""
        with transaction.atomic():
            payroll = CoachPayroll.objects.select_for_update().get(id=payroll.id)
            if payroll.approval_status == CoachPayroll.ApprovalStatus.APPROVED:
                raise ValidationError('این فیش حقوقی قبلاً تأیید شده است.')
            if payroll.approval_status == CoachPayroll.ApprovalStatus.CANCELLED:
                raise ValidationError('فیش حقوقی ابطال‌شده قابل تأیید نیست.')

            payroll.approval_status = CoachPayroll.ApprovalStatus.APPROVED
            payroll.approved_by = approved_by
            payroll.approved_at = timezone.now()
            payroll.save(update_fields=['approval_status', 'approved_by', 'approved_at', 'updated_at'])

            CoachActivityLogger.log(
                coach=payroll.coach,
                event_type=CoachActivityLog.EventType.PAYROLL_APPROVED,
                actor=approved_by,
                description=f"تأیید نهایی حقوق دوره {payroll.period_label} توسط {approved_by.full_name if approved_by else 'مدیر'}",
                metadata={'payroll_id': payroll.id}
            )
            return payroll

    @staticmethod
    def register_payment(
        payroll,
        amount,
        payment_date,
        payment_method,
        reference_number='',
        description='',
        receipt_document=None,
        registered_by=None
    ):
        """ثبت سند پرداخت تمام یا قسطی حقوق مربی با حفظ تمامیت داده‌ها"""
        with transaction.atomic():
            payroll = CoachPayroll.objects.select_for_update().get(id=payroll.id)

            if payroll.approval_status != CoachPayroll.ApprovalStatus.APPROVED:
                raise ValidationError('ثبت پرداخت فقط برای فیش‌های حقوقی تأییدشده مجاز است.')

            amt = Decimal(str(amount))
            if amt <= Decimal('0.00'):
                raise ValidationError('مبلغ واریزی باید بزرگتر از صفر باشد.')

            payment = CoachPaymentRecord.objects.create(
                payroll=payroll,
                coach=payroll.coach,
                payment_number=CoachPaymentRecord.generate_payment_number(),
                amount=amt,
                payment_date=payment_date,
                payment_method=payment_method,
                reference_number=reference_number,
                receipt_document=receipt_document,
                description=description,
                registered_by=registered_by
            )

            payroll.recalculate_payment_status()

            CoachActivityLogger.log(
                coach=payroll.coach,
                event_type=CoachActivityLog.EventType.PAYMENT_REGISTERED,
                actor=registered_by,
                description=f"ثبت پرداخت حقوق به شماره سند {payment.payment_number} به مبلغ {payment.amount:,} تومان (وضعیت پرداخت: {payroll.get_payment_status_display()})",
                metadata={'payment_id': payment.id, 'amount': str(amt), 'payroll_id': payroll.id}
            )
            return payment

    @staticmethod
    def reverse_payment(payment_record, reason, reversed_by):
        """برگشت یا ابطال سند واریزی حقوق مربی بدون حذف فیزیکی (Audit Trail Integrity)"""
        with transaction.atomic():
            record = CoachPaymentRecord.objects.select_for_update().get(id=payment_record.id)
            if record.is_reversal:
                raise ValidationError('یک سند برگشتی نمی‌تواند مجدداً برگشت داده شود.')
            if record.reversal_records.exists():
                raise ValidationError('این سند واریزی قبلاً برگشت داده شده است.')
            if not reason:
                raise ValidationError('درج علت ابطال یا برگشت سند الزامی است.')

            payroll = record.payroll

            reversal = CoachPaymentRecord.objects.create(
                payroll=payroll,
                coach=record.coach,
                payment_number=CoachPaymentRecord.generate_payment_number(),
                amount=record.amount,
                payment_date=timezone.now().date(),
                payment_method=record.payment_method,
                reference_number=f"REV-{record.payment_number}",
                description=f"برگشت سند واریز {record.payment_number} - دلیل: {reason}",
                registered_by=reversed_by,
                is_reversal=True,
                reverses_payment=record
            )

            payroll.recalculate_payment_status()

            CoachActivityLogger.log(
                coach=payroll.coach,
                event_type=CoachActivityLog.EventType.PAYMENT_REVERSED,
                actor=reversed_by,
                description=f"ابطال و برگشت سند پرداخت {record.payment_number} با مبلغ {record.amount:,} تومان - علت: {reason}",
                metadata={'original_payment_id': record.id, 'reversal_payment_id': reversal.id}
            )
            return reversal


class ContractService:
    @staticmethod
    def create_contract(coach, data, created_by=None):
        """ثبت قرارداد جدید مربی"""
        with transaction.atomic():
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            if start_date and end_date and end_date < start_date:
                raise ValidationError('تاریخ پایان قرارداد نمی‌تواند پیش از تاریخ شروع باشد.')

            contract_number = data.get('contract_number') or CoachContract.generate_contract_number()
            status = data.get('status', CoachContract.Status.ACTIVE)

            # اگر قرارداد جدید فعال است، قراردادهای فعال قبلی مربی را منقضی یا بایگانی کن
            if status == CoachContract.Status.ACTIVE:
                coach.contracts.filter(status=CoachContract.Status.ACTIVE).update(status=CoachContract.Status.EXPIRED)

            contract = CoachContract.objects.create(
                coach=coach,
                contract_number=contract_number,
                contract_type=data.get('contract_type', CoachContract.ContractType.STANDARD),
                start_date=start_date,
                end_date=end_date,
                employment_type=data.get('employment_type', CoachProfile.EmploymentType.HOURLY),
                hourly_rate=Decimal(str(data.get('hourly_rate', 0))),
                fixed_salary=Decimal(str(data.get('fixed_salary', 0))),
                percentage_rate=Decimal(str(data.get('percentage_rate', 0))),
                percentage_basis=data.get('percentage_basis', 'COURSE_GROSS'),
                agreed_weekly_hours=int(data.get('agreed_weekly_hours', 20)),
                status=status,
                document=data.get('document'),
                terms_and_conditions=data.get('terms_and_conditions', ''),
                internal_notes=data.get('internal_notes', ''),
                created_by=created_by
            )

            # همگام‌سازی مشخصات پیش‌فرض مربی در صورت تمایل
            if data.get('sync_to_profile', True):
                coach.employment_type = contract.employment_type
                if contract.hourly_rate > 0:
                    coach.hourly_rate = contract.hourly_rate
                if contract.fixed_salary > 0:
                    coach.fixed_monthly_salary = contract.fixed_salary
                if contract.percentage_rate > 0:
                    coach.revenue_percentage = contract.percentage_rate
                coach.contractual_weekly_hours = contract.agreed_weekly_hours
                coach.save()

            CoachActivityLogger.log(
                coach=coach,
                event_type=CoachActivityLog.EventType.CONTRACT_CREATED,
                actor=created_by,
                description=f"انعقاد قرارداد جدید شماره {contract.contract_number} ({contract.get_employment_type_display()})",
                metadata={'contract_id': contract.id}
            )
            return contract

    @staticmethod
    def renew_contract(old_contract, renewal_data, created_by=None):
        """تمدید قرارداد با حفظ تاریخچه قراردادهای قبلی"""
        with transaction.atomic():
            old_contract.status = CoachContract.Status.RENEWED
            old_contract.save(update_fields=['status', 'updated_at'])

            new_contract_number = renewal_data.get('contract_number') or CoachContract.generate_contract_number()
            renewal_data['contract_number'] = new_contract_number
            renewal_data['status'] = CoachContract.Status.ACTIVE

            new_contract = ContractService.create_contract(
                coach=old_contract.coach,
                data=renewal_data,
                created_by=created_by
            )

            CoachActivityLogger.log(
                coach=old_contract.coach,
                event_type=CoachActivityLog.EventType.CONTRACT_RENEWED,
                actor=created_by,
                description=f"تمدید قرارداد {old_contract.contract_number} با شماره جدید {new_contract.contract_number}",
                metadata={'old_contract_id': old_contract.id, 'new_contract_id': new_contract.id}
            )
            return new_contract


class AttendanceCorrectionService:
    @staticmethod
    def correct_session(coach, session, new_status, new_hours, reason, adjusted_by):
        """اصلاحیه دستی ساعت و حضور مربی در جلسه کلاسی با ثبت ردپای حسابرسی (Audit Trail)"""
        with transaction.atomic():
            if not reason:
                raise ValidationError('ذکر دلیل اصلاح سوابق تدریس الزامی است.')

            prev_status = session.status
            # Previous hours
            prev_hours = Decimal('0.00')
            if session.start_time and session.end_time:
                t1 = datetime.datetime.combine(session.session_date, session.start_time)
                t2 = datetime.datetime.combine(session.session_date, session.end_time)
                prev_hours = Decimal(str(max(0, (t2 - t1).total_seconds()) / 3600.0)).quantize(Decimal('0.01'))

            audit = CoachAttendanceCorrectionAudit.objects.create(
                coach=coach,
                session=session,
                previous_status=prev_status,
                new_status=new_status,
                previous_hours=prev_hours,
                new_hours=Decimal(str(new_hours)),
                reason=reason,
                adjusted_by=adjusted_by
            )

            # Update session status
            session.status = new_status
            session.save(update_fields=['status', 'updated_at'])

            CoachActivityLogger.log(
                coach=coach,
                event_type=CoachActivityLog.EventType.ATTENDANCE_CORRECTED,
                actor=adjusted_by,
                description=f"اصلاح سابقه تدریس جلسه مورخ {session.session_date} - علت: {reason}",
                metadata={'audit_id': audit.id, 'session_id': session.id}
            )
            return audit
