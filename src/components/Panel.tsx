import type { PropsWithChildren, ReactNode } from "react";

type PanelProps = PropsWithChildren<{
  id: string;
  title: string;
  eyebrow: string;
  aside?: ReactNode;
}>;

export function Panel({ id, title, eyebrow, aside, children }: PanelProps) {
  const titleId = `${id}-title`;

  return (
    <section id={id} className="panel" aria-labelledby={titleId}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 id={titleId}>{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
