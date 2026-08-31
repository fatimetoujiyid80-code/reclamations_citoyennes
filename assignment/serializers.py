from rest_framework import serializers

from .models import RegleAffectation


class RegleAffectationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegleAffectation
        fields = ["id", "categorie", "zone", "service_cible", "priorite", "active"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        """
        La contrainte unique partielle en base (uq_regle_active_categorie_zone)
        ne détecte PAS les doublons quand categorie et/ou zone sont vides
        (NULL != NULL en SQL) — vérifié empiriquement. On revalide donc ici
        explicitement, pour le cas le plus courant : une règle "toutes zones"
        (zone=None) par catégorie.
        """
        categorie = attrs.get("categorie", getattr(self.instance, "categorie", None))
        zone = attrs.get("zone", getattr(self.instance, "zone", None))
        active = attrs.get("active", getattr(self.instance, "active", True))

        if active:
            conflit = RegleAffectation.objects.filter(categorie=categorie, zone=zone, active=True)
            if self.instance is not None:
                conflit = conflit.exclude(pk=self.instance.pk)
            if conflit.exists():
                raise serializers.ValidationError(
                    "Une règle active existe déjà pour cette combinaison catégorie/zone."
                )
        return attrs
    