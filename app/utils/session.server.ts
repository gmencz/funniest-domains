import { compare, hash } from "bcrypt";
import { createCookieSessionStorage, redirect } from "remix";
import { db } from "./db.server";

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

export let storage = createCookieSessionStorage({
  cookie: {
    name: "FD_session",
    secure: true,
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  let session = await getUserSession(request);
  let userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

export async function createUserSession(userId: string, redirectTo: string) {
  let session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

function validateUsername(username: string) {
  if (username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
}

function validatePassword(password: string) {
  if (password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}

export async function handleUserLogin(body: FormData, redirectTo: string) {
  let loginType = body.get("type");
  let username = body.get("username");
  let password = body.get("password");

  if (
    typeof loginType !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return { formError: `Form not submitted correctly.` };
  }

  let fields = { loginType, username, password };
  let fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return { fieldErrors, fields };
  }

  switch (loginType) {
    case "login": {
      let user = await db.user.findUnique({
        where: {
          username,
        },
        select: {
          id: true,
          password: true,
        },
      });

      if (!user) {
        return { fields, formError: `Invalid username or password` };
      }

      let isValidPassword = await compare(password, user.password);
      if (!isValidPassword) {
        return { fields, formError: `Invalid username or password` };
      }

      return createUserSession(user.id, redirectTo);
    }
    case "register": {
      let userExists = await db.user.findUnique({
        where: { username },
        select: {
          id: true,
        },
      });

      if (userExists) {
        return {
          fields,
          formError: `User with username ${username} already exists`,
        };
      }

      let user = await db.user.create({
        data: {
          password: await hash(password, 12),
          username,
        },
      });

      return createUserSession(user.id, redirectTo);
    }

    default:
      return { fields, formError: `Login type invalid` };
  }
}
