"""
Activities app URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'activities', views.ActivityViewSet)
router.register(r'alerts', views.SystemAlertViewSet)

urlpatterns = [
    path('', include(router.urls)),
]