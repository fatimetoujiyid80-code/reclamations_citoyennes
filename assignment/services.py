from complaints.models import StatutReclamation

from .models import RegleAffectation


def trouver_regle(reclamation):
    """
    Retourne la première RegleAffectation active qui s'applique à la
    réclamation (via RegleAffectation.s_applique_a, Phase 4), triée par
    priorité décroissante (Meta.ordering = ['-priorite'] sur le modèle,
    donc l'ordre naturel du queryset convient déjà).

    Retourne None si aucune règle active ne correspond.
    """
    regles = RegleAffectation.objects.filter(active=True).select_related("service_cible")
    for regle in regles:
        if regle.s_applique_a(reclamation):
            return regle
    return None


def affecter(reclamation):
    """
    Moteur d'affectation automatique (MoteurAffectation, diagramme de
    classes Phase 3). Détermine le service compétent pour une réclamation
    et l'affecte. Ne détermine jamais d'agent précis : l'affectation à un
    agent reste manuelle en V1 (périmètre validé en Phase 1/2).

    - Si une règle correspond : reclamation.service est renseigné et le
      statut passe à AFFECTEE, avec une entrée d'historique automatique
      (via Reclamation.changer_statut(), qui journalise elle-même).
    - Si aucune règle ne correspond : reclamation.service reste None et le
      statut de la réclamation n'est PAS modifié (décision validée
      explicitement — la notification d'un superviseur sera gérée par le
      module notifications, pas ici).

    Retourne le Service affecté, ou None si aucune règle ne correspond.
    """
    regle = trouver_regle(reclamation)
    if regle is None:
        return None

    reclamation.service = regle.service_cible
    reclamation.changer_statut(
        StatutReclamation.AFFECTEE,
        auteur=None,
        commentaire=f"Affectation automatique (règle {regle.id}, priorité {regle.priorite}).",
    )
    return regle.service_cible