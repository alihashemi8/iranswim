from rest_framework import status, generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User
from .serializers import IranSwimTokenObtainPairSerializer, UserSerializer, RegisterSerializer
from .permissions import IsAdminUserRole


class LoginView(TokenObtainPairView):
    serializer_class = IranSwimTokenObtainPairSerializer


class CurrentUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        password = request.data.get('password')
        if password:
            user.set_password(password)
            user.save()
        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserRole]
    filterset_fields = ['role', 'is_active']
    search_fields = ['first_name', 'last_name', 'phone', 'national_id']


class UserDetailView(generics.RetrieveUpdateAPIView):
    """مشاهده و ویرایش مشخصات، نقش و وضعیت فعال بودن کاربر توسط مدیر"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserRole]
