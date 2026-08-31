from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F

from complaints.models import Reclamation, StatutReclamation

STATUTS_RESOLUS = (StatutReclamation.RESOLUE, StatutReclamation.CLOTUREE)


def _appliquer_filtres(queryset, periode_debut=None, periode_fin=None, zone_id=None, categorie_id=None):
    """
    Applique les filtres combinables (période / zone / catégorie) à un
    queryset de Reclamation. Chaque filtre absent est simplement ignoré —
    décision validée : aucune période par défaut si rien n'est fourni.
    """
    if periode_debut:
        queryset = queryset.filter(date_creation__date__gte=periode_debut)
    if periode_fin:
        queryset = queryset.filter(date_creation__date__lte=periode_fin)
    if zone_id:
        queryset = queryset.filter(zone_id=zone_id)
    if categorie_id:
        queryset = queryset.filter(categorie_id=categorie_id)
    return queryset


def calculer_indicateurs(periode_debut=None, periode_fin=None, zone_id=None, categorie_id=None):
    """
    Calcule les indicateurs agrégés (à la volée, aucun cache — décision V1
    actée en Phase 2) sur le sous-ensemble de réclamations filtré.
    """
    queryset = _appliquer_filtres(
        Reclamation.objects.all(), periode_debut, periode_fin, zone_id, categorie_id
    )

    total = queryset.count()

    volumes_par_categorie = [
        {"categorie_id": r["categorie_id"], "categorie_nom": r["categorie__nom"], "total": r["total"]}
        for r in queryset.values("categorie_id", "categorie__nom")
        .annotate(total=Count("id"))
        .order_by("-total")
    ]

    volumes_par_zone = [
        {"zone_id": r["zone_id"], "zone_nom": r["zone__nom"], "total": r["total"]}
        for r in queryset.values("zone_id", "zone__nom")
        .annotate(total=Count("id"))
        .order_by("-total")
    ]

    volumes_par_statut = [
        {"statut": r["statut"], "total": r["total"]}
        for r in queryset.values("statut").annotate(total=Count("id")).order_by("-total")
    ]

    # Délai moyen de traitement : uniquement les réclamations avec date_cloture renseignée.
    # None (pas 0) si aucune réclamation clôturée dans le filtre.
    duree_expr = ExpressionWrapper(F("date_cloture") - F("date_creation"), output_field=DurationField())
    duree_moyenne = (
        queryset.filter(date_cloture__isnull=False)
        .annotate(duree=duree_expr)
        .aggregate(moyenne=Avg("duree"))["moyenne"]
    )
    delai_moyen_heures = round(duree_moyenne.total_seconds() / 3600, 1) if duree_moyenne is not None else None

    # Taux de résolution : None (pas 0%) si le filtre ne contient aucune réclamation.
    if total > 0:
        nb_resolues = queryset.filter(statut__in=STATUTS_RESOLUS).count()
        taux_resolution = round((nb_resolues / total) * 100, 1)
    else:
        taux_resolution = None

    return {
        "total_reclamations": total,
        "volumes_par_categorie": volumes_par_categorie,
        "volumes_par_zone": volumes_par_zone,
        "volumes_par_statut": volumes_par_statut,
        "delai_moyen_traitement_heures": delai_moyen_heures,
        "taux_resolution_pourcent": taux_resolution,
    }


def points_carte(periode_debut=None, periode_fin=None, zone_id=None, categorie_id=None):
    """
    Retourne les points géographiques (latitude/longitude + métadonnées
    minimales) du sous-ensemble filtré, pour affichage carte côté React/Leaflet.
    """
    queryset = _appliquer_filtres(
        Reclamation.objects.select_related("categorie"),
        periode_debut, periode_fin, zone_id, categorie_id,
    )
    return [
        {
            "id": r.id,
            "numero_suivi": r.numero_suivi,
            "titre": r.titre,
            "latitude": float(r.latitude),
            "longitude": float(r.longitude),
            "statut": r.statut,
            "categorie": r.categorie.nom,
            "date_creation": r.date_creation,
        }
        for r in queryset
    ]