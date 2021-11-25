import type { Domain } from "@prisma/client";
import { HeartIcon } from "@heroicons/react/solid";
import { Form, useLocation } from "remix";

type Props = {
  domains: Pick<Domain, "id" | "name" | "likes">[];
};

export function DomainsList({ domains }: Props) {
  let location = useLocation();

  return (
    <ol className="domains-list">
      {domains.map((domain) => (
        <li key={domain.id}>
          <div className="domain">
            <a href={`https://${domain.name}`}>{domain.name}</a>
            <Form
              action={location.pathname + location.search + "&index"}
              method="post"
            >
              <input type="hidden" name="domain-id" value={domain.id} />
              <input type="hidden" name="_action" value="like" />

              <button type="submit" className="like-button">
                <HeartIcon className="heart-icon" />
                <span className="likes-number">{Math.floor(domain.likes)}</span>
              </button>
            </Form>
          </div>
        </li>
      ))}
    </ol>
  );
}
