export interface LegalDraftContent {
  title: string;
  titleFr: string;
  titleRw: string;
  contentMarkdown: string;
  contentMarkdownFr: string;
  contentMarkdownRw: string;
}

export function toLegalDraftContent(
  draft: LegalDraftContent & { documentType?: unknown },
): LegalDraftContent {
  return {
    title: draft.title,
    titleFr: draft.titleFr,
    titleRw: draft.titleRw,
    contentMarkdown: draft.contentMarkdown,
    contentMarkdownFr: draft.contentMarkdownFr,
    contentMarkdownRw: draft.contentMarkdownRw,
  };
}
