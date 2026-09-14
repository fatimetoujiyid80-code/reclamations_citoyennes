from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import Service, Utilisateur, Zone


class UtilisateurCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Utilisateur
        fields = ("email", "nom", "prenom")


class UtilisateurChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = Utilisateur
        fields = (
            "email", "nom", "prenom", "telephone", "role", "service",
            "is_active", "is_staff", "is_superuser",
        )


@admin.register(Utilisateur)
class UtilisateurAdmin(DjangoUserAdmin):
    add_form = UtilisateurCreationForm
    form = UtilisateurChangeForm
    model = Utilisateur

    list_display = ("email", "nom", "prenom", "role", "service", "is_active")
    list_filter = ("role", "service", "is_active")
    search_fields = ("email", "nom", "prenom")
    ordering = ("email",)
    readonly_fields = ("date_creation",)
    filter_horizontal = ("groups", "user_permissions")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informations personnelles", {"fields": ("nom", "prenom", "telephone")}),
        ("Rôle et service", {"fields": ("role", "service")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates importantes", {"fields": ("last_login", "date_creation")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "nom", "prenom", "password1", "password2"),
        }),
    )


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("nom", "actif")
    list_filter = ("actif",)
    search_fields = ("nom",)


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ("nom", "service")
    list_filter = ("service",)
    search_fields = ("nom",)