from django.contrib import admin

from .models import Categorie, HistoriqueStatut, Media, Reclamation


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ("nom",)
    search_fields = ("nom",)


class MediaInline(admin.TabularInline):
    model = Media
    extra = 0
    readonly_fields = ("id", "fichier", "type_media", "taille_octets", "date_upload")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class HistoriqueStatutInline(admin.TabularInline):
    model = HistoriqueStatut
    extra = 0
    readonly_fields = ("ancien_statut", "nouveau_statut", "commentaire", "auteur", "date_changement")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Reclamation)
class ReclamationAdmin(admin.ModelAdmin):
    list_display = ("numero_suivi", "titre", "statut", "categorie", "service", "citoyen", "date_creation")
    list_filter = ("statut", "categorie", "service")
    search_fields = ("numero_suivi", "titre")
    inlines = [MediaInline, HistoriqueStatutInline]
    readonly_fields = [f.name for f in Reclamation._meta.fields]

    def has_add_permission(self, request):
        return False


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
    list_display = ("reclamation", "type_media", "taille_octets", "date_upload")
    list_filter = ("type_media",)
    readonly_fields = [f.name for f in Media._meta.fields]

    def has_add_permission(self, request):
        return False


@admin.register(HistoriqueStatut)
class HistoriqueStatutAdmin(admin.ModelAdmin):
    list_display = ("reclamation", "ancien_statut", "nouveau_statut", "auteur", "date_changement")
    list_filter = ("nouveau_statut",)
    readonly_fields = [f.name for f in HistoriqueStatut._meta.fields]

    def has_add_permission(self, request):
        return False