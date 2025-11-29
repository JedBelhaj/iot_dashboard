"""
Frontend URLs for serving the dashboard HTML
"""
from django.urls import path
from django.views.generic import TemplateView
from django.http import FileResponse
from django.conf import settings
import os

def serve_index(request):
    """Serve the main dashboard HTML file"""
    html_path = os.path.join(settings.BASE_DIR.parent, 'index.html')
    if os.path.exists(html_path):
        return FileResponse(open(html_path, 'rb'), content_type='text/html')
    else:
        from django.http import HttpResponse
        return HttpResponse("Dashboard not found", status=404)

def serve_css(request, filename):
    """Serve CSS files"""
    css_path = os.path.join(settings.BASE_DIR.parent, 'css', filename)
    if os.path.exists(css_path):
        return FileResponse(open(css_path, 'rb'), content_type='text/css')
    else:
        from django.http import HttpResponse
        return HttpResponse("CSS file not found", status=404)

def serve_js(request, filename):
    """Serve JavaScript files"""
    js_path = os.path.join(settings.BASE_DIR.parent, 'js', filename)
    if os.path.exists(js_path):
        return FileResponse(open(js_path, 'rb'), content_type='application/javascript')
    else:
        from django.http import HttpResponse
        return HttpResponse("JS file not found", status=404)

urlpatterns = [
    path('', serve_index, name='dashboard'),
    path('css/<str:filename>', serve_css, name='css'),
    path('js/<str:filename>', serve_js, name='js'),
]