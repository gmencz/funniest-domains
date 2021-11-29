import type { Domain } from "@prisma/client";
import type {
  LoaderFunction,
  ActionFunction,
  MetaFunction,
  ShouldReloadFunction,
} from "remix";
import {
  useLoaderData,
  useTransition,
  Link,
  redirect,
  Outlet,
  json,
  useLocation,
} from "remix";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { DomainsList } from "~/components/domains-list";
import { getUserId, requireUserId } from "~/utils/session.server";

export let unstable_shouldReload: ShouldReloadFunction = ({ url, prevUrl }) => {
  let prevSearch = new URLSearchParams(prevUrl.search);
  let search = new URLSearchParams(url.search);
  let prevPage = prevSearch.get("page");
  let page = search.get("page");
  return prevPage !== page;
};

export let meta: MetaFunction = () => {
  return {
    title: "Funniest domains",
    description: "A collection of the funniest domains out there",
  };
};

export type LoaderData = {
  domains: (Pick<Domain, "id" | "name" | "likes"> & { likedByUser: boolean })[];
  pages: number;
  isLoggedIn: boolean;
};

const DOMAINS_PER_PAGE = 1;

export let loader: LoaderFunction = async ({ request }) => {
  let url = new URL(request.url);
  let params = new URLSearchParams(url.search);
  let page = params.get("page") ?? 1;
  let userId = await getUserId(request);

  if (userId) {
    let [domains, domainsCount] = await Promise.all([
      db.domain.findMany({
        orderBy: [{ likes: "desc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          name: true,
          likes: true,
          likedBy: {
            where: { userId: { equals: userId } },
            select: { userId: true },
          },
        },
        take: DOMAINS_PER_PAGE,
        skip: Number(page) * DOMAINS_PER_PAGE - 1,
      }),

      db.domain.count(),
    ]);

    return {
      domains: domains.map(({ likedBy, ...domain }) => {
        return {
          ...domain,
          likedByUser: likedBy.length > 0,
        };
      }),
      pages: Math.ceil(domainsCount / DOMAINS_PER_PAGE),
      isLoggedIn: true,
    };
  }

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
    domains: domains.map((domain) => {
      return {
        ...domain,
        likedByUser: false,
      };
    }),
    pages: Math.ceil(domainsCount / DOMAINS_PER_PAGE),
    isLoggedIn: false,
  };
};

export let action: ActionFunction = async ({ request }) => {
  let body = await request.formData();
  let action = body.get("_action");
  let url = new URL(request.url);

  switch (action) {
    case "like": {
      let domainId = body.get("domain-id");
      if (typeof domainId !== "string") {
        return json({ error: `Invalid body` }, { status: 400 });
      }

      let searchParams = new URLSearchParams(url.search);
      let page = searchParams.get("page");
      let userId = await requireUserId(
        request,
        page ? `${url.pathname}/login?page=${page}` : `${url.pathname}/login`
      );

      let isAlreadyliked = await db.userLikedDomains.findUnique({
        where: {
          userId_domainId: {
            domainId,
            userId,
          },
        },
      });

      if (isAlreadyliked) {
        return json(
          { error: `You've already liked this domain` },
          { status: 400 }
        );
      }

      await db.domain.update({
        where: { id: domainId },
        data: {
          likes: {
            increment: 1,
          },
          likedBy: { create: { userId } },
        },
      });

      return redirect(url.pathname + url.search);
    }

    case "unlike": {
      let domainId = body.get("domain-id");
      if (typeof domainId !== "string") {
        return json({ error: `Invalid body` }, { status: 400 });
      }

      let searchParams = new URLSearchParams(url.search);
      let page = searchParams.get("page");
      let userId = await requireUserId(
        request,
        page ? `${url.pathname}/login?page=${page}` : `${url.pathname}/login`
      );

      let isLiked = await db.userLikedDomains.findUnique({
        where: {
          userId_domainId: {
            domainId,
            userId,
          },
        },
      });

      if (!isLiked) {
        return json(
          { error: `You haven't liked this domain` },
          { status: 400 }
        );
      }

      await db.domain.update({
        where: { id: domainId },
        data: {
          likes: {
            decrement: 1,
          },
          likedBy: { delete: { userId_domainId: { userId, domainId } } },
        },
      });

      return redirect(url.pathname + url.search);
    }

    default:
      return json({ error: `Invalid body` }, { status: 400 });
  }
};

export default function Domains() {
  let { domains, pages, isLoggedIn } = useLoaderData<LoaderData>();
  let transition = useTransition();
  let location = useLocation();
  let optimisticDomainsList;

  if (transition.submission) {
    let body = transition.submission.formData;
    let action = body.get("_action");

    switch (action) {
      case "like": {
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
                  likedByUser: true,
                };
              }

              return domain;
            })}
          />
        );

        break;
      }

      case "unlike": {
        let domainId = body.get("domain-id");
        invariant(typeof domainId === "string");

        optimisticDomainsList = (
          <DomainsList
            isLoggedIn={isLoggedIn}
            domains={domains.map((domain) => {
              if (domain.id === domainId) {
                return {
                  ...domain,
                  likes: domain.likes - 1,
                  likedByUser: false,
                };
              }

              return domain;
            })}
          />
        );

        break;
      }
    }
  }

  return (
    <div className="w-full mx-auto max-w-2xl flex flex-col h-full py-8 px-6 border-r-2 border-l-2 border-gray-200">
      <header className="mb-8 flex items-center">
        <h1 className="font-black text-2xl text-gray-900 italic mr-4">
          funniest.domains
        </h1>

        <div className="ml-auto flex">
          {isLoggedIn ? (
            <>
              <Link
                to="submit"
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Submit a domain
              </Link>
            </>
          ) : (
            <>
              <Link
                to={"login" + location.search}
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </header>

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
