import type { Domain } from "@prisma/client";
import { LoaderFunction, ActionFunction } from "remix";
import { useLoaderData, redirect, useTransition } from "remix";
import invariant from "tiny-invariant";
import { db } from "~/utils/db.server";
import { DomainsList } from "~/components/domains-list";

type LoaderData = {
  domains: Pick<Domain, "id" | "name" | "likes">[];
};

export let loader: LoaderFunction = async () => {
  let domains = await db.domain.findMany({
    orderBy: [{ likes: "desc" }, { updatedAt: "desc" }],
    select: { id: true, name: true, likes: true },
  });

  return { domains };
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
  let { domains } = useLoaderData<LoaderData>();
  let transition = useTransition();

  if (transition.submission) {
    let body = transition.submission.formData;
    let action = body.get("_action");

    switch (action) {
      case "like":
        let domainId = body.get("domain-id");
        invariant(typeof domainId === "string");

        return (
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

  return <DomainsList domains={domains} />;
}
