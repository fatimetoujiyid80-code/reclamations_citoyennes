from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.models import RoleUtilisateur

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Lecture seule stricte : ReadOnlyModelViewSet n'expose que list/retrieve
    (GET) — aucune route create/update/destroy n'est générée par le router,
    donc POST/PUT/PATCH/DELETE sont impossibles par construction, pas par
    une permission qu'on pourrait oublier d'appliquer.

    - CITOYEN / AGENT / SUPERVISEUR / DECIDEUR : uniquement leurs propres
      notifications (utilisateur = request.user).
    - ADMINISTRATEUR : toutes les notifications.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)
        base = Notification.objects.select_related("utilisateur", "reclamation")
        if role == RoleUtilisateur.ADMINISTRATEUR or user.is_superuser:
            return base.all()
        return base.filter(utilisateur=user)