import type { ProofPoint } from "@/content/types";

/**
 * Le bandeau des quatre chiffres.
 *
 * Chaque valeur est rendue **complète** par le serveur. L'animation de décompte
 * ne fait que la remplacer temporairement : sans JavaScript, le chiffre est déjà
 * là et juste. C'est la règle de toute la page — une animation n'est jamais ce
 * qui rend une information visible.
 */
export function ProofBar({ points }: { readonly points: readonly ProofPoint[] }) {
  return (
    <div className="proof">
      <div className="proof__inner">
        {points.map((point) => (
          <div key={point.label} data-reveal="">
            <p className="proof__value">
              {point.prefix}
              {point.counts ? (
                <span data-count={point.value.replace(",", ".")}>{point.value}</span>
              ) : (
                point.value
              )}
              {point.unit ? <> <i className="proof__unit">{point.unit}</i></> : null}
            </p>
            <p className="proof__label">{point.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
