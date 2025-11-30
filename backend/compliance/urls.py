from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'hunting-zones', views.HuntingZoneViewSet)
router.register(r'ammunition-purchases', views.AmmunitionPurchaseViewSet)
router.register(r'violations', views.ComplianceViolationViewSet)
router.register(r'licenses', views.HunterLicenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
]