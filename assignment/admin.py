from django import forms
from django.contrib import admin

from .models import RegleAffectation


class RegleAffectationAdminForm(forms.ModelForm):
    """
    Réplique la même vérification que RegleAffectationSerializer.validate()
    (déjà validée côté API) : la contrainte unique partielle en base ne
    détecte pas les doublons quand categorie et/ou zone sont vides
    (NULL != NULL en SQL) — donc revalidation explicite ici aussi.
    """

    class Meta:
        model = RegleAffectation
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        categorie = cleaned_data.get("categorie")
        zone = cleaned_data.get("zone")
        active = cleaned_data.get("active")

        if active:
            conflit = RegleAffectation.objects.filter(categorie=categorie, zone=zone, active=True)
            if self.instance.pk:
                conflit = conflit.exclude(pk=self.instance.pk)
            if conflit.exists():
                raise forms.ValidationError(
                    "Une règle active existe déjà pour cette combinaison catégorie/zone."
                )
        return cleaned_data


@admin.register(RegleAffectation)
class RegleAffectationAdmin(admin.ModelAdmin):
    form = RegleAffectationAdminForm
    list_display = ("categorie", "zone", "service_cible", "priorite", "active")
    list_filter = ("active", "service_cible")