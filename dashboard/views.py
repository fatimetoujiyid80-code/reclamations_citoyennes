import uuid
from datetime import date

from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsSuperviseurAdminOuDecideur
from .services import calculer_indicateurs, points_carte


def _valider_date(valeur, nom_champ, erreurs):
    if valeur is None:
        return None

    try:
        return date.fromisoformat(valeur)
    except ValueError:
        erreurs[nom_champ] = ["Format invalide, attendu YYYY-MM-DD."]
        return None


def _valider_uuid(valeur, nom_champ, erreurs):
    if valeur is None:
        return None

    try:
        uuid.UUID(valeur)
        return valeur
    except ValueError:
        erreurs[nom_champ] = ["UUID invalide."]
        return None


def _lire_filtres(request):
    """
    Lit et valide les 4 paramètres de requête communs aux deux endpoints.
    Retourne (filtres, erreurs).
    Si erreurs n'est pas vide, la vue doit répondre 400
    sans appeler le service.
    """
    params = request.query_params
    erreurs = {}

    filtres = {
        "periode_debut": _valider_date(
            params.get("periode_debut"),
            "periode_debut",
            erreurs,
        ),
        "periode_fin": _valider_date(
            params.get("periode_fin"),
            "periode_fin",
            erreurs,
        ),
        "zone_id": _valider_uuid(
            params.get("zone"),
            "zone",
            erreurs,
        ),
        "categorie_id": _valider_uuid(
            params.get("categorie"),
            "categorie",
            erreurs,
        ),
    }

    return filtres, erreurs


def _filtres_appliques(filtres):
    return {
        "periode_debut": filtres["periode_debut"],
        "periode_fin": filtres["periode_fin"],
        "zone": filtres["zone_id"],
        "categorie": filtres["categorie_id"],
    }


class TableauDeBordKPIView(APIView):
    """GET /api/dashboard/kpi/ — indicateurs agrégés, filtrables."""

    permission_classes = [IsSuperviseurAdminOuDecideur]

    def get(self, request):
        filtres, erreurs = _lire_filtres(request)

        if erreurs:
            return Response(erreurs, status=400)

        indicateurs = calculer_indicateurs(**filtres)

        return Response({
            "filtres_appliques": _filtres_appliques(filtres),
            **indicateurs,
        })


class TableauDeBordCarteView(APIView):
    """GET /api/dashboard/carte/ — points géographiques, mêmes filtres que kpi/."""

    permission_classes = [IsSuperviseurAdminOuDecideur]

    def get(self, request):
        filtres, erreurs = _lire_filtres(request)

        if erreurs:
            return Response(erreurs, status=400)

        points = points_carte(**filtres)

        return Response({
            "filtres_appliques": _filtres_appliques(filtres),
            "total_points": len(points),
            "points": points,
        })