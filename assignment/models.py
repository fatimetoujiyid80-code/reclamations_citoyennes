import uuid

from django.db import models


class RegleAffectation(models.Model):
    """
    Règle paramétrable pilotant le moteur d'affectation automatique
    (assignment/services.py). Une réclamation est affectée au service
    dont la règle active correspond à sa catégorie et/ou sa zone.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    categorie = models.ForeignKey(
        "complaints.Categorie",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="regles_affectation",
        help_text="Laisser vide pour une règle applicable à toutes les catégories.",
    )
    zone = models.ForeignKey(
        "accounts.Zone",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="regles_affectation",
        help_text="Laisser vide pour une règle applicable à toutes les zones.",
    )
    service_cible = models.ForeignKey(
        "accounts.Service",
        on_delete=models.PROTECT,
        related_name="regles_affectation",
    )
    priorite = models.IntegerField(default=0, help_text="Priorité décroissante en cas de conflit.")
    active = models.BooleanField(default=True)

    class Meta:
        db_table = "assignment_regleaffectation"
        verbose_name = "Règle d'affectation"
        verbose_name_plural = "Règles d'affectation"
        ordering = ["-priorite"]
        constraints = [
            models.UniqueConstraint(
                fields=["categorie", "zone"],
                condition=models.Q(active=True),
                name="uq_regle_active_categorie_zone",
            )
        ]
        indexes = [
            models.Index(fields=["active"], name="ix_regle_active"),
        ]

    def __str__(self):
        return f"{self.categorie or 'Toutes catégories'} / {self.zone or 'Toutes zones'} → {self.service_cible}"

    def s_applique_a(self, reclamation):
        if self.categorie_id and self.categorie_id != reclamation.categorie_id:
            return False
        if self.zone_id and self.zone_id != reclamation.zone_id:
            return False
        return self.active
