import type { Domain } from "@prisma/client";
import type { LoaderFunction, ActionFunction } from "remix";
import { useLoaderData, redirect, useTransition, Link } from "remix";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { DomainsList } from "~/components/domains-list";

type LoaderData = {
  domains: Pick<Domain, "id" | "name" | "likes">[];
  pages: number;
};

const DOMAINS_PER_PAGE = 1;

export let loader: LoaderFunction = async ({ request }) => {
  let url = new URL(request.url);
  let params = new URLSearchParams(url.search);
  let page = params.get("page") ?? 1;

  console.log(Number(page) - 1);

  let [domains, domainsCount] = await Promise.all([
    db.domain.findMany({
      orderBy: [{ likes: "desc" }, { updatedAt: "desc" }],
      select: { id: true, name: true, likes: true },
      take: DOMAINS_PER_PAGE,
      skip: Number(page) * DOMAINS_PER_PAGE - 1,
    }),

    db.domain.count(),
  ]);

  return { domains, pages: Math.ceil(domainsCount / DOMAINS_PER_PAGE) };
};

export let action: ActionFunction = async ({ request }) => {
  let body = await request.formData();
  let action = body.get("_action");

  switch (action) {
    case "like":
      let domainId = body.get("domain-id");
      invariant(typeof domainId === "string");

      await db.domain.update({
        where: { id: domainId },
        data: {
          likes: {
            increment: 1,
          },
        },
      });

      return redirect("/domains");
    default:
      return redirect("/domains");
  }
};

export default function Domains() {
  let { domains, pages } = useLoaderData<LoaderData>();
  let transition = useTransition();
  let optimisticDomainsList;

  if (transition.submission) {
    let body = transition.submission.formData;
    let action = body.get("_action");

    switch (action) {
      case "like":
        let domainId = body.get("domain-id");
        invariant(typeof domainId === "string");

        optimisticDomainsList = (
          <DomainsList
            domains={domains
              .map((domain) => {
                if (domain.id === domainId) {
                  return {
                    ...domain,
                    // We increment by 1.01 to get the same sorted result set that
                    // the database will send if the submission suceeds. This is
                    // a great example of optimistic UI.
                    likes: domain.likes + 1.01,
                  };
                }

                return domain;
              })
              .sort((a, b) => (a.likes > b.likes ? -1 : 1))}
          />
        );
    }
  }

  return (
    <>
      {optimisticDomainsList ?? <DomainsList domains={domains} />}

      {pages > 1 ? (
        <footer className="pagination-footer">
          <ol className="pagination-footer-list">
            {Array.from({ length: pages }).map((_, index) => (
              <li key={index}>
                <Link
                  className="pagination-page-link"
                  to={`?page=${index + 1}`}
                  prefetch="intent"
                >
                  {index + 1}
                </Link>
              </li>
            ))}
          </ol>
        </footer>
      ) : null}
    </>
  );
}
