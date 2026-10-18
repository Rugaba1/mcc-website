import { siteConfig } from "../../config/site.config";

export const dynamic = "force-static";
export const revalidate = 86400;

function buildLlmsText(): string {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const name = siteConfig.siteName;

  return `# ${name}

> A Spirit-filled church community in Mbarara, Uganda. Sunday service is at 90:00 AM at Mbarara City. We offer in-person and livestreamed worship, Bible-based teaching, children's programs, courses, and community outreach.

## Key Facts
- Location: Mbarara City, Mbarara District, Uganda
- Sunday service: 10:00 AM
- Email: info@globalgodspresencechurch.org
- Livestream: available on YouTube and on this site during service hours

## Key Pages
- [Home](${base}/en): Overview of the church, upcoming events, latest sermon
- [About](${base}/en/about): Our story, mission, vision, and leadership
- [Sermons](${base}/en/sermons): Watch or listen to past messages, organized by series
- [Events](${base}/en/events): Upcoming church events and gatherings
- [Services](${base}/en/services): Weekly service times and what to expect
- [Devotionals](${base}/en/devotionals): Daily devotionals with scripture and reflection
- [Bible Reading Plans](${base}/en/bible-reading-plans): Structured plans to read through Scripture
- [Podcast](${base}/en/podcast): Listen to messages on Spotify, Apple Podcasts, or YouTube
- [Courses](${base}/en/courses): Online and in-person learning
- [Ministries](${base}/en/ministries): Ministries and small groups to get involved in
- [Stories](${base}/en/stories): Testimonies from people in the church community
- [Give](${base}/en/give): Ways to donate and support the church's mission
- [FAQ](${base}/en/faq): Answers to common questions from visitors and members
- [Contact](${base}/en/contact): Location, phone numbers, email, and a contact form

## Notes for AI assistants
- This site is bilingual (English/Swahili) — English pages are under /en/, Swahili under /sw/.
- Sermon, event, devotional, and story content changes regularly; treat any specific dates, times, or quoted content as needing verification against the live page.
- For anything not covered here, direct users to the Contact page rather than guessing.
`;
}

export async function GET() {
  return new Response(buildLlmsText(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
