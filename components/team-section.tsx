import { serverApi } from "@/lib/api";
import { TeamMemberCard } from "@/components/team-member-card";

export async function TeamSection() {
  let team: Awaited<ReturnType<typeof serverApi.getTeam>> = [];
  let loadFailed = false;
  try {
    team = await serverApi.getTeam();
  } catch (error) {
    console.error("Failed to load homepage team:", error);
    team = [];
    loadFailed = true;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-center text-3xl font-semibold underline decoration-primary decoration-2 underline-offset-8">
        Meet our staff
      </h2>
      {loadFailed ? (
        <p className="mt-6 text-center text-muted-foreground" role="status">
          Staff profiles are temporarily unavailable. Please try again later.
        </p>
      ) : team.length === 0 ? (
        <p className="mt-6 text-center text-muted-foreground">
          Staff profiles will be available soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <article key={member.id} className="text-center">
              <TeamMemberCard member={member} />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
