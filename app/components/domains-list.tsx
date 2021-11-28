import type { Domain } from "@prisma/client";
import { Form, useNavigate, useLocation } from "remix";
import { LikeButton } from "./like-button";

type Props = {
  domains: Pick<Domain, "id" | "name" | "likes">[];
  isLoggedIn: boolean;
};

export function DomainsList({ domains, isLoggedIn }: Props) {
  let navigate = useNavigate();
  let location = useLocation();

  return (
    <>
      <ol className="flex flex-col gap-4">
        {domains.map((domain) => (
          <li key={domain.id}>
            <div className="flex flex-col items-start">
              <a href={`https://${domain.name}`}>{domain.name}</a>

              {isLoggedIn ? (
                <Form
                  action={location.pathname + location.search}
                  method="post"
                >
                  <input type="hidden" name="domain-id" value={domain.id} />
                  <input type="hidden" name="_action" value="like" />

                  <LikeButton likes={Math.floor(domain.likes)} type="submit" />
                </Form>
              ) : (
                <>
                  <LikeButton
                    likes={Math.floor(domain.likes)}
                    onClick={() => navigate("login" + location.search)}
                  />
                </>
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
