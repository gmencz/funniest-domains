import type { Domain } from "@prisma/client";
import type { LoaderFunction, ActionFunction, MetaFunction } from "remix";
import { useLoaderData, useTransition, Link, redirect, Outlet } from "remix";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { DomainsList } from "~/components/domains-list";
import { getUserId } from "~/utils/session.server";

export let meta: MetaFunction = () => {
  return {
    title: "Funniest domains",
    description: "A collection of the funniest domains out there",
  };
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
      if (typeof domainId !== "string") {
        return { error: `Form not submitted correctly.` };
      }

      await db.domain.update({
        where: { id: domainId },
        data: {
          likes: {
            increment: 1,
          },
        },
      });

      return redirect(url.pathname + url.search);

    default:
      return { error: `Invalid action.` };
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
    <div className="w-full mx-auto max-w-lg flex flex-col h-full py-8 px-4">
      <h1 className="font-bold text-2xl text-gray-900 mb-6">
        funniest.domains
      </h1>

      {optimisticDomainsList ?? (
        <DomainsList isLoggedIn={isLoggedIn} domains={domains} />
      )}

      {pages > 1 ? (
        <footer className="mt-auto">
          <ol className="flex gap-3">
            {Array.from({ length: pages }).map((_, index) => (
              <li key={index}>
                <Link
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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

      <Outlet />
    </div>
  );
}
