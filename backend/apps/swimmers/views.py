from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import SwimmerProfile, SwimmerGuardianRelation, DocumentStatus
from .serializers import SwimmerProfileSerializer, SwimmerGuardianRelationSerializer
from apps.accounts.permissions import IsAdminUserRole, IsOwnerSwimmerOrAdmin


def get_accessible_swimmer_profile(user, swimmer_id=None):
    """Retrieve swimmer profile accessible by user (either self or guardian)"""
    if swimmer_id:
        try:
            profile = SwimmerProfile.objects.get(id=swimmer_id)
            if user.role in ['ADMIN', 'SUPERVISOR'] or user.is_superuser:
                return profile
            if profile.user == user:
                return profile
            if SwimmerGuardianRelation.objects.filter(guardian=user, swimmer=profile).exists():
                return profile
        except SwimmerProfile.DoesNotExist:
            pass

    # Check guardian relations first
    relation = SwimmerGuardianRelation.objects.filter(guardian=user).first()
    if relation:
        return relation.swimmer

    # Fallback to direct user profile
    profile = getattr(user, 'swimmer_profile', None)
    if not profile:
        profile = SwimmerProfile.objects.create(
            user=user,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            national_id=user.national_id or ''
        )
    # Ensure relation exists
    SwimmerGuardianRelation.objects.get_or_create(
        guardian=user,
        swimmer=profile,
        defaults={'relationship_type': 'SELF', 'is_primary': True, 'is_verified': True}
    )
    return profile


class SwimmerMeView(APIView):
    """مشاهده و ویرایش پرونده شناگر جاری واردشده یا فرزند انتخاب‌شده"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        swimmer_id = self.request.query_params.get('swimmer_id') or self.request.headers.get('X-Swimmer-Id')
        return get_accessible_swimmer_profile(self.request.user, swimmer_id)

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


class SwimmerChildrenView(APIView):
    """مدیریت فرزندان متصل به حساب والد (مشاهده لیست و ثبت فرزند دوم/جدید)"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        user = request.user
        # Auto-link direct profile if not linked yet
        if hasattr(user, 'swimmer_profile') and user.swimmer_profile:
            SwimmerGuardianRelation.objects.get_or_create(
                guardian=user,
                swimmer=user.swimmer_profile,
                defaults={'relationship_type': 'SELF', 'is_primary': True, 'is_verified': True}
            )

        relations = SwimmerGuardianRelation.objects.filter(guardian=user).select_related('swimmer', 'swimmer__current_level')
        serializer = SwimmerGuardianRelationSerializer(relations, many=True)
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        first_name = request.data.get('first_name', '').strip()
        last_name = request.data.get('last_name', '').strip()
        national_id = request.data.get('national_id', '').strip()
        relationship_type = request.data.get('relationship_type', 'GUARDIAN')
        gender = request.data.get('gender', 'MALE')

        if not first_name or not last_name:
            return Response({'detail': 'نام و نام خانوادگی فرزند الزامی است.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create new swimmer profile for child
        child_profile = SwimmerProfile.objects.create(
            user=None, # Child does not need an independent user login yet
            first_name=first_name,
            last_name=last_name,
            national_id=national_id,
            gender=gender,
            father_phone=user.phone if relationship_type == 'FATHER' else '',
            mother_phone=user.phone if relationship_type == 'MOTHER' else '',
            is_profile_completed=False
        )

        relation = SwimmerGuardianRelation.objects.create(
            guardian=user,
            swimmer=child_profile,
            relationship_type=relationship_type,
            is_primary=True,
            is_verified=True
        )

        return Response(SwimmerGuardianRelationSerializer(relation).data, status=status.HTTP_201_CREATED)


class SwimmerCompleteProfileView(APIView):
    """اعتبارسنجی و ثبت نهایی مدارک و تکمیل پرونده هویتی شناگر"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        user = request.user
        swimmer_id = request.data.get('swimmer_id') or request.query_params.get('swimmer_id')
        profile = get_accessible_swimmer_profile(user, swimmer_id)

        serializer = SwimmerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        # Update document statuses to PENDING if newly uploaded or previously unuploaded
        if profile.birth_certificate_image and profile.birth_certificate_status in [DocumentStatus.UNUPLOADED, DocumentStatus.REVISION_REQUIRED]:
            profile.birth_certificate_status = DocumentStatus.PENDING
        if profile.national_card_image and profile.national_card_status in [DocumentStatus.UNUPLOADED, DocumentStatus.REVISION_REQUIRED]:
            profile.national_card_status = DocumentStatus.PENDING
        if profile.sports_insurance_image and profile.sports_insurance_status in [DocumentStatus.UNUPLOADED, DocumentStatus.REVISION_REQUIRED]:
            profile.sports_insurance_status = DocumentStatus.PENDING

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
            profile.save()
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

