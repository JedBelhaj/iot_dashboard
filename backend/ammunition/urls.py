"""
Ammunition app URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'inventory', views.AmmunitionViewSet)
router.register(r'transactions', views.AmmunitionTransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]