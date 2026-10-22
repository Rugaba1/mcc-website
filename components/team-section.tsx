import { UserRound } from "lucide-react";
import { serverApi } from "@/lib/api";

export async function TeamSection() {
    const team = await serverApi.getTeam().catch(() => []);
    if (!team.length) return null;

    return (
        <section className="mx-auto max-w-7xl px-4 py-16">
            <h2 className="text-3xl font-semibold">Meet our team</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {team.map((m) => (
                    <article key={m.id} className="text-center">
                        <div className="mx-auto flex aspect-square w-full max-w-60 items-center justify-center overflow-hidden bg-muted">
                            {m.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={m.image} alt={m.name} className="size-full object-cover" />
                            ) : (
                                <UserRound className="size-12 text-muted-foreground" />
                            )}
                        </div>
                        <h3 className="mt-3 font-medium">{m.name}</h3>
                        {m.jobTitle && <p className="text-sm text-muted-foreground">{m.jobTitle}</p>}
                        {m.bio && <p className="mt-2 text-sm">{m.bio}</p>}
                    </article>
                ))}
            </div>
        </section>
    );
}