"""
Sensors app URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'readings', views.SensorReadingViewSet)
router.register(r'devices', views.SensorDeviceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]