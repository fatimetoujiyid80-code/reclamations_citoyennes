from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import RegleAffectationViewSet

router = DefaultRouter()
router.register("regles-affectation", RegleAffectationViewSet, basename="regleaffectation")

urlpatterns = [
    path("", include(router.urls)),
]