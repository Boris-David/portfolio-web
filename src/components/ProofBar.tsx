import type { ProofPoint } from "@/content/types";

/**
 * The band of four figures.
 *
 * Every value is rendered **in full** by the server. The count-up animation only
 * replaces it temporarily: without JavaScript, the figure is already there and
 * correct. That is the rule for the whole page — an animation is never what
 * makes a piece of information visible.
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
