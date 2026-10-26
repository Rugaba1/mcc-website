import { serverApi } from "@/lib/api";
import { TeamMemberCard } from "@/components/team-member-card";

export async function TeamSection() {
  const team = await serverApi.getTeam().catch(() => []);
  if (!team.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-3xl font-semibold">Meet our team</h2>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {team.map((member) => (
          <article key={member.id} className="text-center">
            <TeamMemberCard member={member} />
          </article>
        ))}
      </div>
    </section>
  );
}
