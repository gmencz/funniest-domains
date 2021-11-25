import { Dialog } from "@headlessui/react";
import type { Domain } from "@prisma/client";
import { useState } from "react";
import { Form } from "remix";
import { LikeButton } from "./like-button";
import { LoginDialog } from "./login-dialog";

type Props = {
  domains: Pick<Domain, "id" | "name" | "likes">[];
  isLoggedIn: boolean;
};

export function DomainsList({ domains, isLoggedIn }: Props) {
  let [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <ol className="domains-list">
      {domains.map((domain) => (
        <li key={domain.id}>
          <div className="domain">
            <a href={`https://${domain.name}`}>{domain.name}</a>

            {isLoggedIn ? (
              <Form method="post">
                <input type="hidden" name="domain-id" value={domain.id} />
                <input type="hidden" name="_action" value="like" />

                <LikeButton
                  likes={Math.floor(domain.likes)}
                  type="submit"
                  className="like-button"
                />
              </Form>
            ) : (
              <>
                <LikeButton
                  likes={Math.floor(domain.likes)}
                  className="like-button"
                  onClick={() => setIsLoginOpen(true)}
                />

                <LoginDialog
                  open={isLoginOpen}
                  description="You need an account to like domains"
                  onClose={() => setIsLoginOpen(false)}
                />
              </>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
