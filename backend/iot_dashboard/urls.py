"""
URL configuration for IoT Dashboard project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/hunters/', include('hunters.urls')),
    path('api/sensors/', include('sensors.urls')),
    path('api/ammunition/', include('ammunition.urls')),
    path('api/activities/', include('activities.urls')),
    path('api/compliance/', include('compliance.urls')),
    path('api/', include('iot_dashboard.api_urls')),
    
    # OpenAPI/Swagger documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Serve frontend at root
    path('', include('iot_dashboard.frontend_urls')),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)