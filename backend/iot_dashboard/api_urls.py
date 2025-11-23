"""
Main API URLs for general dashboard statistics
"""
from django.urls import path
from . import views

urlpatterns = [
    path('dashboard-stats/', views.DashboardStatsView.as_view(), name='dashboard-stats'),
    path('system-status/', views.SystemStatusView.as_view(), name='system-status'),
]