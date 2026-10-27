from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import SwimmerProfile
from .serializers import SwimmerProfileSerializer
from apps.accounts.permissions import IsAdminUserRole, IsOwnerSwimmerOrAdmin


class SwimmerMeView(APIView):
    """مشاهده و ویرایش پرونده شناگر جاری واردشده"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        user = self.request.user
        profile = getattr(user, 'swimmer_profile', None)
        if not profile:
            profile = SwimmerProfile.objects.create(
                user=user,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                national_id=user.national_id or ''
            )
        return profile

    def get(self, request):
        profile = self.get_object()
        serializer = SwimmerProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile = self.get_object()
        serializer = SwimmerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class SwimmerCompleteProfileView(APIView):
    """اعتبارسنجی و ثبت نهایی مدارک و تکمیل پرونده هویتی شناگر"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        user = request.user
        profile = getattr(user, 'swimmer_profile', None)
        if not profile:
            profile = SwimmerProfile.objects.create(
                user=user,
                first_name=user.first_name,
                last_name=user.last_name,
                phone=user.phone,
                national_id=user.national_id or ''
            )

        serializer = SwimmerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        # Check all required fields specified by user:
        missing = []
        if not profile.first_name or not profile.last_name:
            missing.append('نام و نام خانوادگی')
        if not profile.date_of_birth:
            missing.append('تاریخ تولد')
        if not profile.father_name:
            missing.append('نام پدر')
        if not profile.national_id or len(profile.national_id.strip()) != 10:
            missing.append('کد ملی ۱۰ رقمی معتبر')
        if not profile.address:
            missing.append('آدرس منزل')
        if not (profile.father_phone or profile.mother_phone or profile.emergency_contact_phone):
            missing.append('شماره تماس مادر یا پدر (حداقل یک شماره)')
        if not profile.gender:
            missing.append('جنسیت')
        if not profile.birth_certificate_image:
            missing.append('عکس صفحه اول شناسنامه')
        if not profile.national_card_image:
            missing.append('عکس کارت ملی')
        if not profile.sports_insurance_image:
            missing.append('عکس بیمه ورزشی')

        if missing:
            return Response({
                'detail': f'تکمیل موارد ستاره‌دار زیر الزامی است: {", ".join(missing)}',
                'missing_fields': missing
            }, status=status.HTTP_400_BAD_REQUEST)

        profile.is_profile_completed = True
        profile.save()

        return Response({
            'detail': 'پرونده هویتی و مدارک شناگر با موفقیت تکمیل و ثبت نهایی شد.',
            'profile': SwimmerProfileSerializer(profile).data
        }, status=status.HTTP_200_OK)


class SwimmerListView(generics.ListCreateAPIView):
    """مدیریت شناگران توسط مدیر، یا مشاهده مشخصات توسط مدیر/ناظر"""
    queryset = SwimmerProfile.objects.all().select_related('current_level', 'user')
    serializer_class = SwimmerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
            qs = SwimmerProfile.objects.all().select_related('current_level', 'user')
            level = self.request.query_params.get('level')
            if level:
                qs = qs.filter(current_level_id=level)
            search = self.request.query_params.get('search')
            if search:
                qs = qs.filter(first_name__icontains=search) | qs.filter(last_name__icontains=search) | qs.filter(phone__icontains=search)
            return qs
        elif user.role == 'COACH':
            coach_profile = getattr(user, 'coach_profile', None)
            if not coach_profile:
                return SwimmerProfile.objects.none()
            assigned_group_ids = coach_profile.assigned_groups.values_list('group_id', flat=True)
            return SwimmerProfile.objects.filter(
                enrollments__group_id__in=assigned_group_ids
            ).distinct().select_related('current_level', 'user')
        elif user.role == 'SWIMMER':
            return SwimmerProfile.objects.filter(user=user).select_related('current_level', 'user')
        return SwimmerProfile.objects.none()


class SwimmerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SwimmerProfile.objects.all().select_related('current_level', 'user')
    serializer_class = SwimmerProfileSerializer
    permission_classes = [IsOwnerSwimmerOrAdmin]

