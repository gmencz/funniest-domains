import type { LoaderData } from "~/routes/domains";
import { Form, useLocation } from "remix";
import { LikeButton, LikeLink } from "./like-button";
import { UnlikeButton } from "./unlike-button";

type Props = {
  domains: LoaderData["domains"];
  isLoggedIn: boolean;
};

export function DomainsList({ domains, isLoggedIn }: Props) {
  let location = useLocation();

  return (
    <>
      <ol className="flex flex-col gap-4">
        {domains.map((domain) => (
          <li key={domain.id}>
            <div className="flex flex-col items-start">
              <a
                href={`https://${domain.name}`}
                className="text-gray-700 font-medium underline"
              >
                {domain.name}
              </a>

              {isLoggedIn ? (
                <Form
                  action={location.pathname + location.search}
                  method="post"
                  className="mt-2"
                >
                  {domain.likedByUser ? (
                    <>
                      <input type="hidden" name="domain-id" value={domain.id} />
                      <input type="hidden" name="_action" value="unlike" />

                      <UnlikeButton
                        likes={Math.floor(domain.likes)}
                        type="submit"
                      />
                    </>
                  ) : (
                    <>
                      <input type="hidden" name="domain-id" value={domain.id} />
                      <input type="hidden" name="_action" value="like" />

                      <LikeButton
                        likes={Math.floor(domain.likes)}
                        type="submit"
                      />
                    </>
                  )}
                </Form>
              ) : (
                <div className="mt-2">
                  <LikeLink
                    likes={Math.floor(domain.likes)}
                    to={"login" + location.search}
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
