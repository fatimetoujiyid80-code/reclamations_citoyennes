import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger(__name__)


def exception_handler(exc, context):
    """
    Gestionnaire d'exceptions global de l'API DRF.

    1. Délègue d'abord au gestionnaire par défaut de DRF — inchangé pour
       tout ce qu'il gère déjà nativement : ValidationError DRF (serializers),
       permissions refusées, authentification manquante, 404, méthode HTTP
       non autorisée, etc. Zéro changement de comportement sur ces cas.

    2. Si DRF ne reconnaît pas l'exception mais qu'il s'agit d'une
       ValidationError DJANGO (pas celle de DRF) — typiquement levée par
       l'ORM lui-même quand un UUID malformé est comparé à une clé primaire
       (ex. get_object_or_404 avec un pk invalide) — on la convertit
       proprement en 400, au même format que le reste de l'API.

    3. Toute autre exception réellement inattendue est journalisée côté
       serveur (pour le débogage) et renvoyée comme un 500 JSON minimal,
       sans jamais exposer de trace ni de détail interne au client.
    """
    response = drf_exception_handler(exc, context)
    if response is not None:
        return response

    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, "message_dict"):
            detail = dict(exc.message_dict)
        else:
            detail = {"detail": list(exc.messages)}
        return Response(detail, status=400)

    logger.exception("Erreur interne non gérée dans l'API : %s", exc)
    return Response({"detail": "Une erreur interne est survenue."}, status=500)