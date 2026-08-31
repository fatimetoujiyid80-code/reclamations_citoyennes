import logging

from django.utils import timezone

from .models import CanalNotification, Notification, StatutEnvoi

logger = logging.getLogger(__name__)


def envoyer_sms(destinataire, message):
    """
    Simulation d'envoi SMS pour la V1 (MVP) — aucune intégration Twilio ou
    autre fournisseur réel. Se contente de journaliser le message et
    retourne toujours succès (True).

    POINT D'EXTENSION V2 : remplacer uniquement le corps de cette fonction
    par un appel réel à l'API du fournisseur SMS choisi (ex. Twilio),
    en conservant la même signature — (destinataire: str, message: str) -> bool —
    de sorte qu'aucun appelant (notifier_changement_statut ci-dessous)
    n'ait à changer.
    """
    logger.info("SIMULATION SMS -> %s : %s", destinataire, message)
    return True


def _construire_message(reclamation):
    return (
        f"Votre réclamation {reclamation.numero_suivi} ({reclamation.titre}) "
        f"est maintenant au statut : {reclamation.get_statut_display()}."
    )


def notifier_changement_statut(reclamation):
    """
    ServiceNotification (diagramme de classes UML, Phase 3). Notifie le
    citoyen propriétaire d'une réclamation par SMS (seul canal implémenté
    en V1 ; PUSH reste dans le modèle mais n'est pas déclenché ici) et
    enregistre systématiquement une Notification, que l'envoi réussisse ou
    non — pour garder une trace de toute tentative.

    - Citoyen avec téléphone renseigné : envoi (simulé), statut ENVOYE.
    - Citoyen sans téléphone (chaîne vide) : aucune tentative d'envoi,
      statut ECHEC, contenu quand même enregistré.

    Ne lève jamais d'exception : une notification manquée ne doit jamais
    interrompre le flux principal (création/changement de statut d'une
    réclamation) — cohérent avec le traitement synchrone décidé en V1
    (Phase 2) : cet appel doit rester rapide et sans effet de bord bloquant.
    """
    citoyen = reclamation.citoyen
    message = _construire_message(reclamation)

    if not citoyen.telephone:
        return Notification.objects.create(
            utilisateur=citoyen,
            reclamation=reclamation,
            canal=CanalNotification.SMS,
            contenu=message,
            statut_envoi=StatutEnvoi.ECHEC,
            date_envoi=None,
        )

    succes = envoyer_sms(citoyen.telephone, message)
    return Notification.objects.create(
        utilisateur=citoyen,
        reclamation=reclamation,
        canal=CanalNotification.SMS,
        contenu=message,
        statut_envoi=StatutEnvoi.ENVOYE if succes else StatutEnvoi.ECHEC,
        date_envoi=timezone.now() if succes else None,
    )