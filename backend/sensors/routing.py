"""
Sensors WebSocket routing
"""
from django.urls import re_path
from . import consumers
from .shot_consumer import ShotSimulatorConsumer

websocket_urlpatterns = [
    re_path(r'ws/sensors/$', consumers.SensorConsumer.as_asgi()),
    re_path(r'ws/shots/$', ShotSimulatorConsumer.as_asgi()),
]