/* A picture of the clinic each plan is sized for: one dot per doctor.
 * Follows the limits in `tariffs.plans` (2 doctors, 7 doctors, unlimited),
 * so update it together with that copy. */

const TEAM_SIZES = [2, 7];
const UNLIMITED_DOTS = 44;

export default function PlanArt({
  index,
  featured = false,
}: {
  index: number;
  featured?: boolean;
}) {
  const unlimited = index >= TEAM_SIZES.length;
  const count = unlimited ? UNLIMITED_DOTS : TEAM_SIZES[index];

  const dot = featured
    ? "bg-gradient-to-br from-sky-400 via-violet-400 to-rose-400"
    : "bg-violet-600";

  return (
    <div
      aria-hidden
      className={`flex h-28 items-center overflow-hidden rounded-2xl px-5 ${
        featured ? "bg-white/[0.07]" : "bg-[#eef1f6]"
      }`}
    >
      {unlimited ? (
        /* Runs off the edge: there is no last doctor. */
        <div className="grid w-[130%] shrink-0 grid-cols-11 gap-2 [mask-image:linear-gradient(to_right,black_35%,transparent_78%)]">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className={`aspect-square rounded-full ${dot}`} />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          {Array.from({ length: count }, (_, i) => (
            <span
              key={i}
              className={`rounded-full ${dot} ${count <= 2 ? "h-11 w-11" : "h-8 w-8"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
