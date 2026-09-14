const STYLES_PAR_STATUT = {
  NOUVELLE: { backgroundColor: "#e0e0e0", color: "#333" },
  RECUE: { backgroundColor: "#cfe8fc", color: "#0b5394" },
  AFFECTEE: { backgroundColor: "#fff3cd", color: "#856404" },
  EN_COURS: { backgroundColor: "#ffe5b4", color: "#8a5300" },
  RESOLUE: { backgroundColor: "#d4edda", color: "#155724" },
  CLOTUREE: { backgroundColor: "#d1ecf1", color: "#0c5460" },
  REJETEE: { backgroundColor: "#f8d7da", color: "#721c24" },
};

const LIBELLES_PAR_STATUT = {
  NOUVELLE: "Nouvelle",
  RECUE: "Reçue",
  AFFECTEE: "Affectée",
  EN_COURS: "En cours",
  RESOLUE: "Résolue",
  CLOTUREE: "Clôturée",
  REJETEE: "Rejetée",
};

function StatutBadge({ statut }) {
  const style = STYLES_PAR_STATUT[statut] || { backgroundColor: "#eee", color: "#333" };
  const libelle = LIBELLES_PAR_STATUT[statut] || statut;

  return (
    <span
      style={{
        ...style,
        padding: "0.2rem 0.6rem",
        borderRadius: "999px",
        fontSize: "0.85rem",
        fontWeight: 500,
      }}
    >
      {libelle}
    </span>
  );
}

export default StatutBadge;