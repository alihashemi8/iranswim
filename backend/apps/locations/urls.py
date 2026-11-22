from django.urls import path
from apps.locations.views import (
    AutocompleteAPIView,
    LocationSearchAPIView,
    PopularPlacesAPIView,
    ReverseGeocodeAPIView,
)

app_name = 'locations'

urlpatterns = [
    path('autocomplete/', AutocompleteAPIView.as_view(), name='autocomplete'),
    path('search/', LocationSearchAPIView.as_view(), name='search'),
    path('popular/', PopularPlacesAPIView.as_view(), name='popular'),
    path('reverse/', ReverseGeocodeAPIView.as_view(), name='reverse'),
]
