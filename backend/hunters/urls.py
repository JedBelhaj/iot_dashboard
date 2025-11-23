"""
Hunters app URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'hunters', views.HunterViewSet)
router.register(r'guns', views.GunViewSet)
router.register(r'shots', views.ShotViewSet)

urlpatterns = [
    path('', include(router.urls)),
]