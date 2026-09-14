import { useEffect, useState } from "react";

export function useGeolocation() {
  const [position, setPosition] = useState({ latitude: null, longitude: null });
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let annule = false;

    async function initialiser() {
      // Défère au prochain microtask : évite tout setState synchrone
      // directement dans l'exécution de l'effet.
      await Promise.resolve();
      if (annule) {
        return;
      }

      if (!navigator.geolocation) {
        setErreur("La géolocalisation n'est pas disponible sur ce navigateur.");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!annule) {
            setPosition({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            setLoading(false);
          }
        },
        () => {
          if (!annule) {
            setErreur("Impossible de récupérer votre position automatiquement. Vous pouvez la saisir manuellement.");
            setLoading(false);
          }
        }
      );
    }

    initialiser();

    return () => {
      annule = true;
    };
  }, []);

  return { latitude: position.latitude, longitude: position.longitude, erreur, loading };
}