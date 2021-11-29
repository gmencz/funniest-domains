import { Form, json, redirect, useActionData, useTransition } from "remix";
import type { ActionFunction, MetaFunction, LoaderFunction } from "remix";
import { db } from "~/utils/db.server";
import { requireUserId } from "~/utils/session.server";
import { Prisma } from "@prisma/client";

type ActionData = {
  formError?: string;
  fieldErrors?: {
    domain: string;
  };
  fields?: {
    domain: string;
  };
};

function validateDomain(domain: string) {
  if (domain.length > 253) {
    return `Domains must be shorter than 254 characters`;
  }

  if (domain.startsWith("-") || domain.endsWith("-")) {
    return `Domains must not commence or end with a hyphen`;
  }

  let labels = domain.split(".");
  if (labels.length < 2) {
    return `Domains must have at least one [.]`;
  }

  let labelError;
  for (let label of labels) {
    if (label.length > 63) {
      labelError = `Labels must be shorter than 64 characters and the '${label}' label is ${label.length} characters long.`;
      break;
    }

    if (!/^[a-z0-9-]+$/i.test(label)) {
      labelError = `Only alphanumeric characters and hyphens can be used in labels and the '${label}' label has other forbidden characters.`;
      break;
    }
  }

  return labelError;
}

export let action: ActionFunction = async ({ request }) => {
  let userId = await requireUserId(request, "/domains/login");
  let body = await request.formData();
  let domain = body.get("domain");

  if (!domain || typeof domain !== "string") {
    return `Form not submitted correctly.`;
  }

  let fields = { domain };
  let fieldErrors = {
    domain: validateDomain(domain),
  };

  if (Object.values(fieldErrors).some(Boolean)) {
    return json({ fieldErrors, fields }, { status: 400 });
  }

  try {
    await db.domainSubmission.create({
      data: {
        domain,
        submittedById: userId,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return json(
          { formError: `You've already submitted the domain ${domain}` },
          { status: 400 }
        );
      }
    }

    throw error;
  }

  return redirect(`/domains/submit/success?domain=${encodeURI(domain)}`);
};

export let meta: MetaFunction = () => {
  return {
    title: `Submit a funny domain`,
  };
};

export let loader: LoaderFunction = async ({ request }) => {
  await requireUserId(request, "/domains/login");
  return new Response();
};

export default function SubmitDomain() {
  let actionData = useActionData<ActionData>();
  let transition = useTransition();

  return (
    <Form
      method="post"
      className="w-full mx-auto max-w-2xl py-8 px-6 space-y-8 divide-y divide-gray-200 flex justify-center items-start flex-col h-full"
      aria-describedby={
        actionData?.formError ? "form-error-message" : undefined
      }
    >
      <div className="space-y-8 divide-y divide-gray-200 w-full">
        <div>
          <h3 className="text-xl font-semibold leading-6 text-gray-900">
            Submit a funny domain
          </h3>

          <p className="mt-2 text-base text-gray-800">
            If the domain meets our requirements, we will list it on the domains
            page for everyone to see and laugh at.
          </p>

          <div className="mt-4 sm:col-span-6">
            <input
              type="text"
              name="domain"
              required
              id="domain"
              disabled={!!transition.submission}
              placeholder="example.com"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full text-base border-gray-300 rounded-md"
              aria-invalid={
                Boolean(actionData?.fieldErrors?.domain) || undefined
              }
              aria-describedby={
                actionData?.fieldErrors?.domain ? "domain-error" : undefined
              }
            />

            {actionData?.fieldErrors?.domain ? (
              <p
                role="alert"
                id="domain-error"
                className="text-red-600 text-sm mt-1"
              >
                {actionData.fieldErrors.domain}
              </p>
            ) : null}
          </div>

          <div className="pt-5">
            <button
              type="submit"
              disabled={!!transition.submission}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {transition.submission ? "Submitting..." : "Submit"}
            </button>

            <div className="mt-4" id="form-error-message">
              {actionData?.formError ? (
                <p className="text-red-600 text-sm mb-2" role="alert">
                  {actionData?.formError}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Form>
  );
}
