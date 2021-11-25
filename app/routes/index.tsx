import type { Domain } from "@prisma/client";
import type {
  LoaderFunction,
  ActionFunction,
  MetaFunction,
  LinksFunction,
} from "remix";
import { useLoaderData, useTransition, Link, json, redirect } from "remix";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { DomainsList } from "~/components/domains-list";
import styles from "~/styles/index.css";
import { getUserId } from "~/utils/session.server";

export let meta: MetaFunction = () => {
  return {
    title: "Funniest domains",
    description: "A collection of the funniest domains out there",
  };
};

export let links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

type LoaderData = {
  domains: Pick<Domain, "id" | "name" | "likes">[];
  pages: number;
  isLoggedIn: boolean;
};

const DOMAINS_PER_PAGE = 1;

export let loader: LoaderFunction = async ({ request }) => {
  let url = new URL(request.url);
  let params = new URLSearchParams(url.search);
  let page = params.get("page") ?? 1;

  let [domains, domainsCount] = await Promise.all([
    db.domain.findMany({
      orderBy: [{ likes: "desc" }, { updatedAt: "desc" }],
      select: { id: true, name: true, likes: true },
      take: DOMAINS_PER_PAGE,
      skip: Number(page) * DOMAINS_PER_PAGE - 1,
    }),

    db.domain.count(),
  ]);

  return {
    domains,
    pages: Math.ceil(domainsCount / DOMAINS_PER_PAGE),
    isLoggedIn: !!(await getUserId(request)),
  };
};

export let action: ActionFunction = async ({ request }) => {
  let body = await request.formData();
  let action = body.get("_action");
  let url = new URL(request.url);

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

      return redirect(url.pathname + url.search);
    case "login":
      console.log({ body });

      return redirect(url.pathname + url.search);

    default:
      return redirect(url.pathname + url.search);
  }
};

export default function Domains() {
  let { domains, pages, isLoggedIn } = useLoaderData<LoaderData>();
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
            isLoggedIn={isLoggedIn}
            domains={domains.map((domain) => {
              if (domain.id === domainId) {
                return {
                  ...domain,
                  likes: domain.likes + 1,
                };
              }

              return domain;
            })}
          />
        );
    }
  }

  return (
    <div className="container">
      <h1>funniest.domains</h1>

      {optimisticDomainsList ?? (
        <DomainsList isLoggedIn={isLoggedIn} domains={domains} />
      )}

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
    </div>
  );
}
