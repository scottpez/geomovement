from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns
from . import views

app_name = 'esearch'

urlpatterns = [
    path('facade/', views.Geomovement.as_view()),
    path('', views.index, name='index'),
]

urlpatterns = format_suffix_patterns(urlpatterns)
