from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MoiView,
    ServiceViewSet,
    UtilisateurInscriptionView,
    UtilisateurViewSet,
    ZoneViewSet,
)

router = DefaultRouter()
router.register("utilisateurs", UtilisateurViewSet, basename="utilisateur")
router.register("services", ServiceViewSet, basename="service")
router.register("zones", ZoneViewSet, basename="zone")

urlpatterns = [
    path("inscription/", UtilisateurInscriptionView.as_view(), name="inscription"),
    path("moi/", MoiView.as_view(), name="moi"),
    path("", include(router.urls)),
]