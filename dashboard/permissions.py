from rest_framework.permissions import BasePermission

from accounts.models import RoleUtilisateur


class IsSuperviseurAdminOuDecideur(BasePermission):
    """
    Autorise uniquement SUPERVISEUR, DECIDEUR et ADMINISTRATEUR — CITOYEN et
    AGENT sont exclus du tableau de bord décisionnel (Phase 1, tableau des
    permissions).
    """

    message = "Cette action est réservée aux superviseurs, décideurs et administrateurs."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        role = getattr(user, "role", None)
        return role in (
            RoleUtilisateur.SUPERVISEUR,
            RoleUtilisateur.DECIDEUR,
            RoleUtilisateur.ADMINISTRATEUR,
        ) or user.is_superuser