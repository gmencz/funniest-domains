import { Dialog } from "@headlessui/react";
import { useRef } from "react";
import {
  Form,
  useActionData,
  useTransition,
  useNavigate,
  ActionFunction,
  useLocation,
} from "remix";
import type { MetaFunction } from "remix";
import { handleUserLogin } from "~/utils/session.server";

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username: string | undefined;
    password: string | undefined;
  };
  fields?: {
    loginType: string;
    username: string;
    password: string;
  };
};

export let meta: MetaFunction = () => {
  return {
    title: "Funniest domains",
    description: "A collection of the funniest domains out there",
  };
};

export let action: ActionFunction = async ({ request }) => {
  let body = await request.formData();
  let url = new URL(request.url);
  let searchParams = new URLSearchParams(url.search);
  let page = searchParams.get("page");
  return handleUserLogin(body, page ? `/domains?page=${page}` : `/domains`);
};

export default function Login() {
  let usernameInputRef = useRef(null);
  let transition = useTransition();
  let actionData = useActionData<ActionData>();
  let navigate = useNavigate();
  let location = useLocation();

  return (
    <Dialog
      initialFocus={usernameInputRef}
      open
      onClose={() => navigate(-1)}
      className="fixed inset-0 overflow-y-auto z-10 flex items-center justify-center"
    >
      <Dialog.Overlay className="bg-gray-200 bg-opacity-70 fixed inset-0" />

      <div className="bg-white relative max-w-md p-4 w-full rounded">
        <Form
          action={location.pathname + location.search}
          method="post"
          replace
          aria-describedby={
            actionData?.formError ? "form-error-message" : undefined
          }
        >
          <div className="mt-4 flex space-x-6">
            <div className="flex items-center">
              <input
                type="radio"
                id="login"
                name="type"
                value="login"
                disabled={!!transition.submission}
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === "login"
                }
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 mr-2"
              />
              <label htmlFor="login">Login</label>
            </div>

            <div className="flex items-center">
              <input
                type="radio"
                id="register"
                name="type"
                disabled={!!transition.submission}
                value="register"
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 mr-2"
                defaultChecked={actionData?.fields?.loginType === "register"}
              />
              <label htmlFor="register">Register</label>
            </div>
          </div>

          <div className="mt-6 flex-col">
            <label
              ref={usernameInputRef}
              htmlFor="username-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              type="text"
              id="username-input"
              name="username"
              required
              min={3}
              disabled={!!transition.submission}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              defaultValue={actionData?.fields?.username}
              aria-invalid={Boolean(actionData?.fieldErrors?.username)}
              aria-describedby={
                actionData?.fieldErrors?.username ? "username-error" : undefined
              }
            />
            {actionData?.fieldErrors?.username ? (
              <p
                role="alert"
                id="username-error"
                className="text-red-600 text-sm mt-1"
              >
                {actionData.fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex-col">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              disabled={!!transition.submission}
              min={6}
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              defaultValue={actionData?.fields?.password}
              aria-invalid={
                Boolean(actionData?.fieldErrors?.password) || undefined
              }
              aria-describedby={
                actionData?.fieldErrors?.password ? "password-error" : undefined
              }
            />
            {actionData?.fieldErrors?.password ? (
              <p
                role="alert"
                id="password-error"
                className="text-red-600 text-sm mt-1"
              >
                {actionData.fieldErrors.password}
              </p>
            ) : null}
          </div>

          <input type="hidden" name="_action" value="login" />

          <div className="mt-6">
            <div id="form-error-message">
              {actionData?.formError ? (
                <p className="text-red-600 text-sm mb-2" role="alert">
                  {actionData?.formError}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={!!transition.submission}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {transition.submission ? "Submitting..." : "Submit"}
            </button>
          </div>
        </Form>
      </div>
    </Dialog>
  );
}
